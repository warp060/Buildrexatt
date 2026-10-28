import { Router, Response } from 'express';
import {
  getDb,
  saveDb,
  enrichLeave,
  enrichCorrection,
  logAudit,
  createNotification,
} from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth';
import { LeaveRequest, AttendanceCorrection } from '../types';

const router = Router();

// ================= LEAVE REQUESTS =================

// GET /api/leave-requests/my
router.get('/my', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const requests = db.leave_requests
    .filter((l) => l.user_id === req.user!.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(enrichLeave);

  res.json({ success: true, records: requests });
});

// POST /api/leave-requests
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { leave_type, start_date, end_date, reason } = req.body;

  if (!leave_type || !start_date || !end_date || !reason) {
    res.status(400).json({ success: false, message: 'All leave fields are required.' });
    return;
  }

  if (start_date > end_date) {
    res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
    return;
  }

  const db = getDb();

  // Prevent overlapping leave requests
  const hasOverlap = db.leave_requests.some(
    (l) =>
      l.user_id === req.user!.id &&
      l.status !== 'rejected' &&
      ((start_date >= l.start_date && start_date <= l.end_date) ||
        (end_date >= l.start_date && end_date <= l.end_date))
  );

  if (hasOverlap) {
    res.status(400).json({
      success: false,
      message: 'You already have an existing pending or approved leave request covering these dates.',
    });
    return;
  }

  // Calculate days count
  const start = new Date(start_date);
  const end = new Date(end_date);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const nowIso = new Date().toISOString();
  const newLeave: LeaveRequest = {
    id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: req.user!.id,
    leave_type,
    start_date,
    end_date,
    days_count: Math.max(1, diffDays),
    reason: reason.trim(),
    status: 'pending',
    reviewed_by: null,
    review_comment: null,
    reviewed_at: null,
    created_at: nowIso,
  };

  db.leave_requests.unshift(newLeave);
  saveDb(db);

  // Notify admins and manager
  const recipients = db.users.filter(
    (u) => u.role === 'admin' || (req.user!.manager_id && u.id === req.user!.manager_id)
  );
  recipients.forEach((recipient) => {
    createNotification(
      recipient.id,
      'New Leave Request',
      `${req.user!.name} requested ${newLeave.days_count} day(s) ${newLeave.leave_type} leave (${start_date} to ${end_date}).`,
      'info',
      '/admin/approvals'
    );
  });

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'CREATE_LEAVE_REQUEST',
    'LEAVE_REQUEST',
    newLeave.id,
    { start_date, end_date, days: newLeave.days_count, leave_type },
    req.ip || '127.0.0.1'
  );

  res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully.',
    record: enrichLeave(newLeave),
  });
});

// GET /api/admin/leave-requests
router.get('/admin/list', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { status, limit, page } = req.query;

  let list = db.leave_requests.map(enrichLeave);

  if (status && status !== 'all' && status !== 'undefined' && status !== 'null') {
    list = list.filter((l) => l.status === status);
  }

  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

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

// PATCH /api/admin/leave-requests/:id/review
router.patch('/admin/:id/review', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const leave = db.leave_requests.find((l) => l.id === req.params.id);

  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave request not found.' });
    return;
  }

  const { status, review_comment } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    return;
  }

  const nowIso = new Date().toISOString();
  leave.status = status;
  leave.reviewed_by = req.user!.id;
  leave.review_comment = review_comment || null;
  leave.reviewed_at = nowIso;

  saveDb(db);

  createNotification(
    leave.user_id,
    `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    `Your leave request for ${leave.start_date} to ${leave.end_date} has been ${status}. ${review_comment ? `Note: ${review_comment}` : ''}`,
    status === 'approved' ? 'success' : 'alert',
    '/leave-requests'
  );

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    status === 'approved' ? 'APPROVE_LEAVE_REQUEST' : 'REJECT_LEAVE_REQUEST',
    'LEAVE_REQUEST',
    leave.id,
    { status, review_comment, target_user: leave.user_id },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: `Leave request ${status} successfully.`,
    record: enrichLeave(leave),
  });
});

// ================= ATTENDANCE CORRECTIONS =================

// GET /api/leave-requests/corrections/my and /api/attendance/correction-requests/my
router.get(['/corrections/my', '/attendance/correction-requests/my'], authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const corrections = db.attendance_corrections
    .filter((c) => c.user_id === req.user!.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(enrichCorrection);

  res.json({ success: true, records: corrections });
});

// POST /api/leave-requests/corrections and /api/attendance/correction-requests
router.post(['/corrections', '/attendance/correction-requests'], authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { attendance_id, work_date, requested_check_in, requested_check_out, reason } = req.body;

  if (!work_date || !requested_check_in || !requested_check_out || !reason) {
    res.status(400).json({ success: false, message: 'All correction fields are required.' });
    return;
  }

  const db = getDb();
  const nowIso = new Date().toISOString();

  const newCorrection: AttendanceCorrection = {
    id: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: req.user!.id,
    attendance_id: attendance_id || 'manual-entry',
    work_date,
    requested_check_in,
    requested_check_out,
    reason: reason.trim(),
    status: 'pending',
    reviewed_by: null,
    review_comment: null,
    reviewed_at: null,
    created_at: nowIso,
  };

  db.attendance_corrections.unshift(newCorrection);
  saveDb(db);

  // Notify admins and manager
  const corrRecipients = db.users.filter(
    (u) => u.role === 'admin' || (req.user!.manager_id && u.id === req.user!.manager_id)
  );
  corrRecipients.forEach((recipient) => {
    createNotification(
      recipient.id,
      'Attendance Correction Submitted',
      `${req.user!.name} submitted a correction for ${work_date}.`,
      'warning',
      '/admin/approvals'
    );
  });

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'CREATE_CORRECTION_REQUEST',
    'ATTENDANCE_CORRECTION',
    newCorrection.id,
    { work_date, requested_check_in, requested_check_out },
    req.ip || '127.0.0.1'
  );

  res.status(201).json({
    success: true,
    message: 'Attendance correction request submitted for admin review.',
    record: enrichCorrection(newCorrection),
  });
});

// GET /api/leave-requests/admin/corrections and /api/admin/attendance-corrections
router.get(['/admin/corrections', '/admin/attendance-corrections'], authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { status, limit, page } = req.query;

  let list = db.attendance_corrections.map(enrichCorrection);

  if (status && status !== 'all' && status !== 'undefined' && status !== 'null') {
    list = list.filter((c) => c.status === status);
  }

  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

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

// PATCH /api/leave-requests/admin/corrections/:id/review and /api/admin/attendance-corrections/:id/review
router.patch(['/admin/corrections/:id/review', '/admin/attendance-corrections/:id/review'], authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const corr = db.attendance_corrections.find((c) => c.id === req.params.id);

  if (!corr) {
    res.status(404).json({ success: false, message: 'Attendance correction request not found.' });
    return;
  }

  const { status, review_comment } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    return;
  }

  const nowIso = new Date().toISOString();
  corr.status = status;
  corr.reviewed_by = req.user!.id;
  corr.review_comment = review_comment || null;
  corr.reviewed_at = nowIso;

  // IF APPROVED: update or insert actual attendance record!
  if (status === 'approved') {
    let att = db.attendance.find(
      (a) => a.id === corr.attendance_id || (a.user_id === corr.user_id && a.work_date === corr.work_date)
    );

    const inTime = new Date(corr.requested_check_in).getTime();
    const outTime = new Date(corr.requested_check_out).getTime();
    const totalMinutes = Math.max(0, Math.round((outTime - inTime) / (1000 * 60)));

    if (att) {
      att.check_in = corr.requested_check_in;
      att.check_out = corr.requested_check_out;
      att.total_minutes = totalMinutes;
      att.status = totalMinutes >= 240 ? 'present' : 'half_day';
      att.notes = 'Updated via approved attendance correction request';
      att.updated_at = nowIso;
    } else {
      att = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: corr.user_id,
        work_date: corr.work_date,
        check_in: corr.requested_check_in,
        check_out: corr.requested_check_out,
        total_minutes: totalMinutes,
        status: totalMinutes >= 240 ? 'present' : 'half_day',
        notes: 'Created via approved attendance correction request',
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.attendance.unshift(att);
    }
  }

  saveDb(db);

  createNotification(
    corr.user_id,
    `Attendance Correction ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    `Your correction request for ${corr.work_date} was ${status}. ${review_comment ? `(${review_comment})` : ''}`,
    status === 'approved' ? 'success' : 'alert',
    '/my-attendance'
  );

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    status === 'approved' ? 'APPROVE_CORRECTION_REQUEST' : 'REJECT_CORRECTION_REQUEST',
    'ATTENDANCE_CORRECTION',
    corr.id,
    { status, review_comment, target_user: corr.user_id },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: `Correction request ${status} successfully.`,
    record: enrichCorrection(corr),
  });
});

export default router;
