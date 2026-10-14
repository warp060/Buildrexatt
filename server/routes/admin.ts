import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  getDb,
  saveDb,
  getTodayStr,
  enrichUser,
  enrichAttendance,
  enrichWorkUpdate,
  logAudit,
  getTiDBStatus,
  syncAllToTiDB,
  runMigrations,
} from '../db';
import { verifyConnection, getPool, TiDBConfig } from '../tidb';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth';
import { User, Department, DashboardStats } from '../types';

const router = Router();

function sanitizeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const today = getTodayStr();

  const totalUsers = db.users.filter((u) => u.status === 'active');
  const employees = totalUsers.filter((u) => u.role === 'employee');
  const interns = totalUsers.filter((u) => u.role === 'intern');

  // Today's attendance
  const todayRecords = db.attendance.filter((a) => a.work_date === today);
  const presentToday = todayRecords.length;
  const currentlyWorking = todayRecords.filter((a) => !a.check_out).length;
  const incompleteToday = todayRecords.filter((a) => a.status === 'incomplete').length;

  // Active on leave today
  const activeLeaves = db.leave_requests.filter(
    (l) => l.status === 'approved' && today >= l.start_date && today <= l.end_date
  );
  const onLeaveToday = activeLeaves.length;

  // Absent = active users (excluding admin) who have not checked in and are not on leave
  const nonAdminActiveCount = employees.length + interns.length;
  const absentToday = Math.max(0, nonAdminActiveCount - presentToday - onLeaveToday);

  const attendanceRate = nonAdminActiveCount > 0
    ? Math.round((presentToday / nonAdminActiveCount) * 100)
    : 100;

  // Pending items
  const pendingUpdates = db.work_updates.filter((w) => w.status === 'submitted').length;
  const pendingLeaves = db.leave_requests.filter((l) => l.status === 'pending').length;
  const pendingCorrections = db.attendance_corrections.filter((c) => c.status === 'pending').length;

  // Recent attendance activity (latest 8)
  const recentAttendance = [...db.attendance]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8)
    .map(enrichAttendance);

  // Department-wise breakdown
  const departmentStats = db.departments.map((dept) => {
    const deptUsers = totalUsers.filter((u) => u.department_id === dept.id);
    const deptUserIds = new Set(deptUsers.map((u) => u.id));
    const deptPresent = todayRecords.filter((a) => deptUserIds.has(a.user_id)).length;
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      total_members: deptUsers.length,
      present_today: deptPresent,
      rate: deptUsers.length > 0 ? Math.round((deptPresent / deptUsers.length) * 100) : 0,
    };
  });

  // 7-day attendance trend
  const trendDays: { date: string; present: number; late: number; rate: number }[] = [];
  const curr = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(curr);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = db.attendance.filter((a) => a.work_date === dateStr);
    const dayPresent = dayRecords.length;
    const dayLate = dayRecords.filter((a) => a.status === 'late').length;
    trendDays.push({
      date: dateStr,
      present: dayPresent,
      late: dayLate,
      rate: nonAdminActiveCount > 0 ? Math.round((dayPresent / nonAdminActiveCount) * 100) : 0,
    });
  }

  const stats: DashboardStats = {
    total_users: totalUsers.length,
    active_employees: employees.length,
    active_interns: interns.length,
    present_today: presentToday,
    currently_working: currentlyWorking,
    absent_today: absentToday,
    on_leave_today: onLeaveToday,
    incomplete_today: incompleteToday,
    attendance_rate_percent: attendanceRate,
    pending_work_updates: pendingUpdates,
    pending_leave_requests: pendingLeaves,
    pending_corrections: pendingCorrections,
  };

  res.json({
    success: true,
    stats,
    recent_attendance: recentAttendance,
    department_stats: departmentStats,
    trend_days: trendDays,
  });
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { role, department_id, status, search } = req.query;

  let list = db.users.map(enrichUser);

  if (role && role !== 'all') {
    list = list.filter((u) => u.role === role);
  }
  if (department_id && department_id !== 'all') {
    list = list.filter((u) => u.department_id === department_id);
  }
  if (status && status !== 'all') {
    list = list.filter((u) => u.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.employee_code.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => a.name.localeCompare(b.name));

  res.json({
    success: true,
    total: list.length,
    users: list.map(sanitizeUser),
  });
});

// POST /api/admin/users (Create employee / intern / admin)
router.post('/users', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    employee_code,
    name,
    email,
    password,
    role = 'employee',
    department_id,
    manager_id,
    position,
    phone,
    joining_date,
  } = req.body;

  if (!name || !email || !role) {
    res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    return;
  }

  const db = getDb();

  // Validate duplicate email
  const existingEmail = db.users.find(
    (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
  );
  if (existingEmail) {
    res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    return;
  }

  // Validate or auto-generate employee_code
  let code = employee_code ? employee_code.trim().toUpperCase() : '';
  if (!code) {
    const prefix = role === 'intern' ? 'BRX-INT-' : 'BRX-';
    const nextNum = db.users.length + 1;
    code = `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  const existingCode = db.users.find((u) => u.employee_code === code);
  if (existingCode) {
    res.status(400).json({ success: false, message: 'Employee code already in use.' });
    return;
  }

  const pass = password && password.length >= 6 ? password : 'Buildrex@2026';
  const passwordHash = await bcrypt.hash(pass, 10);
  const nowIso = new Date().toISOString();

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    employee_code: code,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    role,
    department_id: department_id || null,
    manager_id: manager_id || null,
    position: position ? position.trim() : (role === 'intern' ? 'Associate Intern' : 'Team Member'),
    phone: phone ? phone.trim() : '',
    joining_date: joining_date || getTodayStr(),
    status: 'active',
    created_at: nowIso,
    updated_at: nowIso,
  };

  db.users.push(newUser);
  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'CREATE_USER',
    'USER',
    newUser.id,
    { email: newUser.email, code: newUser.employee_code, role: newUser.role },
    req.ip || '127.0.0.1'
  );

  res.status(201).json({
    success: true,
    message: `Account created successfully for ${newUser.name} (${newUser.employee_code}).`,
    user: sanitizeUser(enrichUser(newUser)),
  });
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const { name, role, department_id, manager_id, position, phone, status, joining_date } = req.body;

  if (name) user.name = name.trim();
  if (role) user.role = role;
  if (department_id !== undefined) user.department_id = department_id || null;
  if (manager_id !== undefined) user.manager_id = manager_id || null;
  if (position) user.position = position.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (status) user.status = status;
  if (joining_date) user.joining_date = joining_date;
  user.updated_at = new Date().toISOString();

  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'UPDATE_USER',
    'USER',
    user.id,
    { status: user.status, role: user.role, name: user.name },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: `User ${user.name} updated successfully.`,
    user: sanitizeUser(enrichUser(user)),
  });
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { new_password } = req.body;
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const pass = new_password && new_password.length >= 6 ? new_password : 'Buildrex@2026';
  user.password_hash = await bcrypt.hash(pass, 10);
  user.updated_at = new Date().toISOString();
  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'ADMIN_RESET_USER_PASSWORD',
    'USER',
    user.id,
    { target: user.email },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: `Password reset successfully for ${user.name}. New temporary password is ${pass}`,
  });
});

// GET /api/admin/reports/attendance
router.get('/reports/attendance', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { start_date, end_date, department_id, role } = req.query;

  let records = db.attendance.map(enrichAttendance);

  if (start_date) {
    records = records.filter((r) => r.work_date >= (start_date as string));
  }
  if (end_date) {
    records = records.filter((r) => r.work_date <= (end_date as string));
  }
  if (role && role !== 'all') {
    records = records.filter((r) => r.role === role);
  }
  if (department_id && department_id !== 'all') {
    records = records.filter((r) => {
      const u = db.users.find((user) => user.id === r.user_id);
      return u?.department_id === department_id;
    });
  }

  records.sort((a, b) => b.work_date.localeCompare(a.work_date));

  const totalSessions = records.length;
  const totalMinutes = records.reduce((acc, cur) => acc + (cur.total_minutes || 0), 0);
  const lateCount = records.filter((r) => r.status === 'late').length;
  const halfDayCount = records.filter((r) => r.status === 'half_day').length;

  res.json({
    success: true,
    summary: {
      total_sessions: totalSessions,
      total_hours: Number((totalMinutes / 60).toFixed(1)),
      average_session_hours: totalSessions > 0 ? Number((totalMinutes / 60 / totalSessions).toFixed(1)) : 0,
      late_arrivals: lateCount,
      half_days: halfDayCount,
    },
    records,
  });
});

// GET /api/admin/reports/work-updates
router.get('/reports/work-updates', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { start_date, end_date, department_id, role, status } = req.query;

  let records = db.work_updates.map(enrichWorkUpdate);

  if (start_date) {
    records = records.filter((r) => r.work_date >= (start_date as string));
  }
  if (end_date) {
    records = records.filter((r) => r.work_date <= (end_date as string));
  }
  if (status && status !== 'all') {
    records = records.filter((r) => r.status === status);
  }
  if (role && role !== 'all') {
    records = records.filter((r) => r.role === role);
  }
  if (department_id && department_id !== 'all') {
    records = records.filter((r) => {
      const u = db.users.find((user) => user.id === r.user_id);
      return u?.department_id === department_id;
    });
  }

  records.sort((a, b) => b.work_date.localeCompare(a.work_date));

  const totalUpdates = records.length;
  const reviewedCount = records.filter((r) => r.status === 'reviewed').length;
  const needsRevisionCount = records.filter((r) => r.status === 'needs_revision').length;
  const pendingCount = records.filter((r) => r.status === 'submitted').length;

  res.json({
    success: true,
    summary: {
      total_updates: totalUpdates,
      reviewed: reviewedCount,
      needs_revision: needsRevisionCount,
      pending_review: pendingCount,
    },
    records,
  });
});

// GET /api/departments
router.get('/departments', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const depts = db.departments.map((d) => {
    const count = db.users.filter((u) => u.department_id === d.id && u.status === 'active').length;
    return { ...d, user_count: count };
  });
  res.json({ success: true, departments: depts });
});

// POST /api/admin/departments
router.post('/departments', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, description, manager_id } = req.body;
  if (!name || !code) {
    res.status(400).json({ success: false, message: 'Department name and code are required.' });
    return;
  }

  const db = getDb();
  const newDept: Department = {
    id: `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description || '',
    manager_id: manager_id || null,
    created_at: new Date().toISOString(),
  };

  db.departments.push(newDept);
  saveDb(db);

  res.status(201).json({ success: true, department: newDept });
});

// PATCH /api/admin/settings
router.patch('/settings', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const {
    company_name,
    work_start_time,
    work_end_time,
    grace_period_minutes,
    half_day_minutes,
    full_day_minutes,
    timezone,
    allow_breaks,
  } = req.body;

  if (company_name) db.company_settings.company_name = company_name;
  if (work_start_time) db.company_settings.work_start_time = work_start_time;
  if (work_end_time) db.company_settings.work_end_time = work_end_time;
  if (grace_period_minutes !== undefined) db.company_settings.grace_period_minutes = Number(grace_period_minutes);
  if (half_day_minutes !== undefined) db.company_settings.half_day_minutes = Number(half_day_minutes);
  if (full_day_minutes !== undefined) db.company_settings.full_day_minutes = Number(full_day_minutes);
  if (timezone) db.company_settings.timezone = timezone;
  if (allow_breaks !== undefined) db.company_settings.allow_breaks = Boolean(allow_breaks);
  db.company_settings.updated_at = new Date().toISOString();

  saveDb(db);

  logAudit(
    { id: req.user!.id, name: req.user!.name },
    'UPDATE_COMPANY_SETTINGS',
    'SETTINGS',
    '1',
    { company_name: db.company_settings.company_name },
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    message: 'Company settings updated successfully.',
    settings: db.company_settings,
  });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const { limit, page } = req.query;

  const pageSize = Number(limit) || 30;
  const currentPage = Number(page) || 1;
  const startIndex = (currentPage - 1) * pageSize;

  const logs = [...db.audit_logs].slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    total: db.audit_logs.length,
    page: currentPage,
    logs,
  });
});

// Notifications
router.get('/notifications', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const userNotifs = db.notifications
    .filter((n) => n.user_id === req.user!.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  res.json({ success: true, notifications: userNotifs });
});

router.patch('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const notif = db.notifications.find((n) => n.id === req.params.id && n.user_id === req.user!.id);

  if (notif) {
    notif.read_at = new Date().toISOString();
    saveDb(db);
  }

  res.json({ success: true });
});

router.post('/notifications/read-all', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  db.notifications.forEach((n) => {
    if (n.user_id === req.user!.id && !n.read_at) {
      n.read_at = nowIso;
    }
  });
  saveDb(db);

  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────
// TiDB Cloud Database Administration Endpoints
// ─────────────────────────────────────────────────────────────────

// GET /api/admin/database/status
router.get('/database/status', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = await getTiDBStatus();
    res.json({ success: true, database: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to inspect database.' });
  }
});

// POST /api/admin/database/test
router.post('/database/test', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { host, port, user, password, database, ssl } = req.body;
    let customPool;
    if (host && user) {
      customPool = getPool({
        host,
        port: parseInt(port || '4000', 10),
        user,
        password: password || '',
        database: database || 'buildrex',
        ssl: ssl !== false,
      });
    }

    const result = await verifyConnection(customPool);
    if (customPool) {
      await customPool.end().catch(() => {});
    }

    if (result.ok) {
      res.json({
        success: true,
        message: `Successfully connected to TiDB Server v${result.version} (${result.latencyMs}ms)`,
        version: result.version,
        latencyMs: result.latencyMs,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Connection test failed: ${result.error}`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/database/sync
router.post('/database/sync', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const result = await syncAllToTiDB(db);
    if (result.ok) {
      logAudit(
        { id: req.user!.id, name: req.user!.name },
        'DATABASE_SYNC_TIDB',
        'SYSTEM',
        'TIDB_CLOUD',
        { status: 'success' },
        req.ip || '127.0.0.1'
      );
      res.json({ success: true, message: 'All tables and records synchronized to TiDB Cloud successfully.' });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/database/migrate
router.post('/database/migrate', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await runMigrations();
    logAudit(
      { id: req.user!.id, name: req.user!.name },
      'DATABASE_MIGRATE_TIDB',
      'SYSTEM',
      'TIDB_CLOUD',
      { status: 'success' },
      req.ip || '127.0.0.1'
    );
    res.json({ success: true, message: 'Schema migrations executed successfully on TiDB Cloud.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
