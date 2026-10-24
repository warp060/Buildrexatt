import { Router, Response } from 'express';
import {
  getDb,
  saveDb,
  getTodayStr,
  calculateAttendanceStatus,
  enrichAttendance,
  logAudit,
} from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth';
import { AttendanceRecord } from '../types';

const router = Router();

// POST /api/attendance/check-in
router.post('/check-in', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const today = getTodayStr();

  // 1. Check for existing session today (prevent duplicate check-ins)
  const existing = db.attendance.find(
    (a) => a.user_id === userId && a.work_date === today
  );

  if (existing) {
    if (existing.check_out) {
      res.status(400).json({
        success: false,
        message: 'You have already completed attendance checkout for today.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: 'You are already checked in for today.',
      attendance: enrichAttendance(existing),
    });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Evaluate late status against company settings
  const { status, isLate } = calculateAttendanceStatus(now, db.company_settings);

  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    work_date: today,
    check_in: nowIso,
    check_out: null,
    total_minutes: 0,
    status,
    notes: isLate ? `Late arrival (checked in after grace window)` : undefined,
    ip_address: req.ip || '127.0.0.1',
    created_at: nowIso,
    updated_at: nowIso,
  };

  db.attendance.unshift(newRecord);
  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'ATTENDANCE_CHECK_IN',
    'ATTENDANCE',
    newRecord.id,
    { work_date: today, check_in: nowIso, status },
    req.ip || '127.0.0.1'
  );

  res.status(201).json({
    success: true,
    message: isLate
      ? 'Checked in successfully. Note: Marked as Late arrival based on company policy.'
      : 'Checked in successfully. Have a productive day at BUILDREX!',
    attendance: enrichAttendance(newRecord),
  });
});

// POST /api/attendance/check-out
router.post('/check-out', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const today = getTodayStr();

  // Find active session
  const record = db.attendance.find(
    (a) => a.user_id === userId && a.work_date === today
  );

  if (!record) {
    res.status(400).json({
      success: false,
      message: 'No active check-in record found for today. Please check in first.',
    });
    return;
  }

  if (record.check_out) {
    res.status(400).json({
      success: false,
      message: 'You have already checked out for today.',
      attendance: enrichAttendance(record),
    });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const checkInTime = new Date(record.check_in);
  const diffMs = now.getTime() - checkInTime.getTime();
  const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  record.check_out = nowIso;
  record.total_minutes = totalMinutes;
  record.updated_at = nowIso;

  // Determine if half-day if minutes below threshold
  const halfDayThreshold = db.company_settings.half_day_minutes || 240;
  if (totalMinutes < halfDayThreshold && record.status === 'present') {
    record.status = 'half_day';
    record.notes = (record.notes ? record.notes + '; ' : '') + 'Shift under 4 hours (Half Day)';
  }

  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'ATTENDANCE_CHECK_OUT',
    'ATTENDANCE',
    record.id,
    { work_date: today, check_out: nowIso, total_minutes: totalMinutes, status: record.status },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: 'Checked out successfully. Today\'s working duration has been recorded.',
    attendance: enrichAttendance(record),
  });
});

// GET /api/attendance/today
router.get('/today', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const today = getTodayStr();

  const record = db.attendance.find(
    (a) => a.user_id === userId && a.work_date === today
  );

  // Compute live duration if currently checked in
  let currentDurationMinutes = 0;
  if (record) {
    if (record.check_out) {
      currentDurationMinutes = record.total_minutes;
    } else {
      const start = new Date(record.check_in).getTime();
      const now = Date.now();
      currentDurationMinutes = Math.max(0, Math.round((now - start) / (1000 * 60)));
    }
  }

  res.json({
    success: true,
    work_date: today,
    record: record ? enrichAttendance(record) : null,
    current_duration_minutes: currentDurationMinutes,
    status_summary: !record
      ? 'Not Started'
      : !record.check_out
      ? 'Checked In'
      : 'Checked Out',
  });
});

// GET /api/attendance/history
router.get('/history', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const { start_date, end_date, status, limit, page } = req.query;

  let records = db.attendance.filter((a) => a.user_id === userId);

  if (start_date) {
    records = records.filter((a) => a.work_date >= (start_date as string));
  }
  if (end_date) {
    records = records.filter((a) => a.work_date <= (end_date as string));
  }
  if (status && status !== 'all') {
    records = records.filter((a) => a.status === status);
  }

  // Sort descending by work_date
  records.sort((a, b) => b.work_date.localeCompare(a.work_date));

  // Compute metrics with live active session enrichment
  const enriched = records.map(enrichAttendance);
  const totalDays = enriched.length;
  const totalMinutes = enriched.reduce((acc, cur) => acc + (cur.total_minutes || 0), 0);
  const lateDays = enriched.filter((r) => r.status === 'late').length;
  const halfDays = enriched.filter((r) => r.status === 'half_day').length;

  const pageSize = Number(limit) || 20;
  const currentPage = Number(page) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = enriched.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    total: enriched.length,
    page: currentPage,
    page_size: pageSize,
    summary: {
      total_days_logged: totalDays,
      total_hours_worked: Number((totalMinutes / 60).toFixed(1)),
      average_hours_per_day: totalDays > 0 ? Number((totalMinutes / 60 / totalDays).toFixed(1)) : 0,
      late_arrivals_count: lateDays,
      half_days_count: halfDays,
    },
    records: paginated,
  });
});

// GET /api/admin/attendance
router.get('/admin/attendance', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { date, start_date, end_date, department_id, role, status, user_id, search, page, limit } = req.query;

  let records = [...db.attendance];

  if (date) {
    records = records.filter((a) => a.work_date === date);
  }
  if (start_date) {
    records = records.filter((a) => a.work_date >= (start_date as string));
  }
  if (end_date) {
    records = records.filter((a) => a.work_date <= (end_date as string));
  }
  if (status && status !== 'all') {
    records = records.filter((a) => a.status === status);
  }
  if (user_id) {
    records = records.filter((a) => a.user_id === user_id);
  }

  let enriched = records.map(enrichAttendance);

  if (department_id && department_id !== 'all') {
    enriched = enriched.filter((a) => {
      const u = db.users.find((user) => user.id === a.user_id);
      return u?.department_id === department_id;
    });
  }

  if (role && role !== 'all') {
    enriched = enriched.filter((a) => a.role === role);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    enriched = enriched.filter(
      (a) =>
        a.user_name?.toLowerCase().includes(q) ||
        a.employee_code?.toLowerCase().includes(q) ||
        a.department_name?.toLowerCase().includes(q)
    );
  }

  // Sort descending by date, then check-in
  enriched.sort((a, b) => b.check_in.localeCompare(a.check_in));

  const pageSize = Number(limit) || 20;
  const currentPage = Number(page) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = enriched.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    total: enriched.length,
    page: currentPage,
    page_size: pageSize,
    records: paginated,
  });
});

// GET /api/admin/attendance/:id
router.get('/admin/attendance/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const record = db.attendance.find((a) => a.id === req.params.id);

  if (!record) {
    res.status(404).json({ success: false, message: 'Attendance record not found.' });
    return;
  }

  res.json({
    success: true,
    record: enrichAttendance(record),
  });
});

// PATCH /api/admin/attendance/:id (manual adjustment by administrator)
router.patch('/admin/attendance/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const record = db.attendance.find((a) => a.id === req.params.id);

  if (!record) {
    res.status(404).json({ success: false, message: 'Attendance record not found.' });
    return;
  }

  const { check_in, check_out, status, notes } = req.body;

  if (check_in) record.check_in = check_in;
  if (check_out !== undefined) record.check_out = check_out || null;
  if (status) record.status = status;
  if (notes !== undefined) record.notes = notes;

  // Recalculate duration if check_in and check_out exist
  if (record.check_in && record.check_out) {
    const inTime = new Date(record.check_in).getTime();
    const outTime = new Date(record.check_out).getTime();
    record.total_minutes = Math.max(0, Math.round((outTime - inTime) / (1000 * 60)));
  }

  record.updated_at = new Date().toISOString();
  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'ADMIN_MANUAL_ATTENDANCE_UPDATE',
    'ATTENDANCE',
    record.id,
    { check_in: record.check_in, check_out: record.check_out, status: record.status },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: 'Attendance record successfully adjusted by administrator.',
    record: enrichAttendance(record),
  });
});

export default router;
