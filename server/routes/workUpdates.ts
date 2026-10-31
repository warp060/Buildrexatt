import { Router, Response } from 'express';
import {
  getDb,
  saveDb,
  getTodayStr,
  enrichWorkUpdate,
  logAudit,
  createNotification,
} from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth';
import { WorkUpdate } from '../types';

const router = Router();

// POST /api/work-updates (Draft or Submit)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  const userId = req.user!.id;
  const {
    work_date,
    tasks_completed,
    project_details,
    accomplishments,
    blockers,
    next_day_plan,
    hours_spent,
    status = 'submitted', // 'draft' or 'submitted'
  } = req.body;

  const targetDate = work_date || getTodayStr();

  if (status === 'submitted') {
    if (!tasks_completed || !project_details) {
      res.status(400).json({
        success: false,
        message: 'Tasks completed and project details are required for final submission.',
      });
      return;
    }
  }

  // Look for existing report for this user & date
  let update = db.work_updates.find(
    (w) => w.user_id === userId && w.work_date === targetDate
  );

  const nowIso = new Date().toISOString();

  if (update) {
    // If already reviewed, cannot directly overwrite without admin action
    if (update.status === 'reviewed') {
      res.status(400).json({
        success: false,
        message: 'This report has already been reviewed by administration and cannot be re-submitted.',
      });
      return;
    }

    // Update existing record
    const wasNeedsRevision = update.status === 'needs_revision';
    update.tasks_completed = tasks_completed || update.tasks_completed;
    update.project_details = project_details || update.project_details;
    update.accomplishments = accomplishments !== undefined ? accomplishments : update.accomplishments;
    update.blockers = blockers !== undefined ? blockers : update.blockers;
    update.next_day_plan = next_day_plan !== undefined ? next_day_plan : update.next_day_plan;
    update.hours_spent = hours_spent ? Number(hours_spent) : update.hours_spent;
    update.status = status;
    update.updated_at = nowIso;
    if (status === 'submitted') {
      update.submitted_at = nowIso;
      if (wasNeedsRevision) {
        update.reviewed_by = null;
        update.review_comment = null;
        update.reviewed_at = null;
      }
    }
  } else {
    // Create new record
    update = {
      id: `wu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      work_date: targetDate,
      tasks_completed: tasks_completed || '',
      project_details: project_details || '',
      accomplishments: accomplishments || '',
      blockers: blockers || '',
      next_day_plan: next_day_plan || '',
      hours_spent: hours_spent ? Number(hours_spent) : 8.0,
      status: status,
      submitted_at: status === 'submitted' ? nowIso : null,
      reviewed_by: null,
      review_comment: null,
      reviewed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    db.work_updates.unshift(update);
  }

  await saveDb(db);

  // Notify admins and manager when report is submitted
  if (status === 'submitted') {
    const recipients = db.users.filter(
      (u) => u.role === 'admin' || (req.user!.manager_id && u.id === req.user!.manager_id)
    );
    const notifTitle = update.review_comment ? 'Work Update Re-submitted' : 'Daily Work Update Submitted';
    const notifMsg = `${req.user!.name} ${update.review_comment ? 're-submitted revised' : 'submitted'} daily work report for ${targetDate}.`;

    recipients.forEach((recipient) => {
      createNotification(
        recipient.id,
        notifTitle,
        notifMsg,
        'info',
        '/admin/work-updates'
      );
    });
  }

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    status === 'draft' ? 'WORK_UPDATE_SAVED_DRAFT' : 'WORK_UPDATE_SUBMITTED',
    'WORK_UPDATE',
    update.id,
    { work_date: targetDate, status },
    req.ip || '127.0.0.1'
  );

  res.status(200).json({
    success: true,
    message: status === 'draft' ? 'Work update draft saved successfully.' : 'Daily work update submitted for admin review.',
    work_update: enrichWorkUpdate(update),
  });
});

// GET /api/work-updates/my
router.get('/my', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const { status, limit, page } = req.query;

  let updates = db.work_updates.filter((w) => w.user_id === userId);

  if (status && status !== 'all') {
    updates = updates.filter((w) => w.status === status);
  }

  updates.sort((a, b) => b.work_date.localeCompare(a.work_date));

  const pageSize = Number(limit) || 20;
  const currentPage = Number(page) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = updates.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    total: updates.length,
    page: currentPage,
    records: paginated.map(enrichWorkUpdate),
  });
});

// GET /api/work-updates/today
router.get('/today', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const today = getTodayStr();

  const update = db.work_updates.find(
    (w) => w.user_id === userId && w.work_date === today
  );

  res.json({
    success: true,
    work_date: today,
    record: update ? enrichWorkUpdate(update) : null,
    is_submitted: update?.status === 'submitted' || update?.status === 'reviewed',
  });
});

// GET /api/work-updates/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const update = db.work_updates.find((w) => w.id === req.params.id);

  if (!update) {
    res.status(404).json({ success: false, message: 'Work update not found.' });
    return;
  }

  // Security check: non-admins can only view their own updates
  if (req.user!.role !== 'admin' && update.user_id !== req.user!.id) {
    res.status(403).json({ success: false, message: 'Unauthorized to view this work update.' });
    return;
  }

  res.json({
    success: true,
    record: enrichWorkUpdate(update),
  });
});

// GET /api/admin/work-updates
router.get('/admin/list', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { date, status, role, department_id, search, limit, page } = req.query;

  let list = db.work_updates.map(enrichWorkUpdate);

  if (date && date !== 'undefined' && date !== 'null') {
    list = list.filter((w) => w.work_date === date);
  }
  if (status && status !== 'all' && status !== 'undefined' && status !== 'null') {
    list = list.filter((w) => w.status === status);
  }
  if (role && role !== 'all' && role !== 'undefined' && role !== 'null') {
    list = list.filter((w) => w.role === role);
  }
  if (department_id && department_id !== 'all' && department_id !== 'undefined' && department_id !== 'null') {
    list = list.filter((w) => {
      const u = db.users.find((user) => user.id === w.user_id);
      return u?.department_id === department_id;
    });
  }
  if (search && search !== 'undefined' && search !== 'null') {
    const q = (search as string).toLowerCase().trim();
    if (q) {
      list = list.filter(
        (w) =>
          w.user_name?.toLowerCase().includes(q) ||
          w.employee_code?.toLowerCase().includes(q) ||
          w.project_details.toLowerCase().includes(q) ||
          w.tasks_completed.toLowerCase().includes(q)
      );
    }
  }

  // Sort descending by work_date, then newest submitted_at/created_at first
  list.sort((a, b) => {
    const dateComp = (b.work_date || '').localeCompare(a.work_date || '');
    if (dateComp !== 0) return dateComp;
    const timeA = a.submitted_at || a.created_at || '';
    const timeB = b.submitted_at || b.created_at || '';
    return timeB.localeCompare(timeA);
  });

  const pageSize = Number(limit) || 20;
  const currentPage = Number(page) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = list.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    total: list.length,
    page: currentPage,
    records: paginated,
  });
});

// PATCH /api/admin/work-updates/:id/review
router.patch('/admin/:id/review', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  const update = db.work_updates.find((w) => w.id === req.params.id);

  if (!update) {
    res.status(404).json({ success: false, message: 'Work update not found.' });
    return;
  }

  const { status, review_comment } = req.body;

  if (!status || !['reviewed', 'needs_revision'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status must be either "reviewed" or "needs_revision".',
    });
    return;
  }

  const nowIso = new Date().toISOString();
  update.status = status;
  update.reviewed_by = req.user!.id;
  update.review_comment = review_comment || null;
  update.reviewed_at = nowIso;
  update.updated_at = nowIso;

  await saveDb(db);

  // Notify the employee / intern
  createNotification(
    update.user_id,
    status === 'reviewed' ? 'Work Update Reviewed' : 'Work Update Needs Revision',
    status === 'reviewed'
      ? `Your work update for ${update.work_date} was approved and marked Reviewed.`
      : `Your reviewer requested revisions for ${update.work_date}: "${review_comment || 'Please update tasks'}"`,
    status === 'reviewed' ? 'success' : 'warning',
    '/work-updates'
  );

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'REVIEW_WORK_UPDATE',
    'WORK_UPDATE',
    update.id,
    { status, review_comment, target_user: update.user_id },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: `Work update marked as ${status === 'reviewed' ? 'Reviewed' : 'Needs Revision'}.`,
    record: enrichWorkUpdate(update),
  });
});

export default router;
