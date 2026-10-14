import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Department,
  AttendanceRecord,
  WorkUpdate,
  LeaveRequest,
  AttendanceCorrection,
  NotificationItem,
  AuditLogItem,
  CompanySettings,
  Holiday,
  DashboardStats,
} from './types';
import {
  initializeTiDB,
  loadAllFromTiDB,
  syncAllToTiDB,
  getTiDBStatus,
  runMigrations,
  ensureDatabaseExists,
  isTiDBConfigured,
} from './tidb';

interface DatabaseSchema {
  users: User[];
  departments: Department[];
  attendance: AttendanceRecord[];
  work_updates: WorkUpdate[];
  leave_requests: LeaveRequest[];
  attendance_corrections: AttendanceCorrection[];
  notifications: NotificationItem[];
  audit_logs: AuditLogItem[];
  company_settings: CompanySettings;
  holidays: Holiday[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'buildrex.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance: DatabaseSchema | null = null;

function getTodayDateString(): string {
  // Return YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateInitialSeed(): DatabaseSchema {
  const defaultPasswordHash = bcrypt.hashSync('Buildrex@2026', 10);
  const nowIso = new Date().toISOString();
  const today = getTodayDateString();

  const departments: Department[] = [
    {
      id: 'dept-eng',
      name: 'Software Engineering',
      code: 'ENG',
      description: 'Core web platforms, distributed cloud services, and client applications',
      manager_id: 'user-emp-1',
      created_at: nowIso,
    },
    {
      id: 'dept-ai',
      name: 'AI & Innovation',
      code: 'AI-LAB',
      description: 'Next-generation intelligent agent systems, automation pipelines, and model evaluation',
      manager_id: 'user-admin-1',
      created_at: nowIso,
    },
    {
      id: 'dept-ux',
      name: 'Product & UI/UX',
      code: 'PROD',
      description: 'User experience design, frontend architecture, and design systems',
      manager_id: 'user-emp-2',
      created_at: nowIso,
    },
    {
      id: 'dept-ops',
      name: 'Operations & Growth',
      code: 'OPS',
      description: 'Operations, people excellence, talent development, and strategic partnerships',
      manager_id: 'user-admin-1',
      created_at: nowIso,
    },
  ];

  const users: User[] = [
    {
      id: 'user-admin-1',
      employee_code: 'BRX-001',
      name: 'Alex Vance',
      email: 'admin@buildrex.com',
      password_hash: defaultPasswordHash,
      role: 'admin',
      department_id: 'dept-ops',
      manager_id: null,
      position: 'Chief Operations Officer',
      phone: '+1 (415) 890-2100',
      joining_date: '2023-01-15',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'user-emp-1',
      employee_code: 'BRX-102',
      name: 'Sarah Chen',
      email: 'sarah.chen@buildrex.com',
      password_hash: defaultPasswordHash,
      role: 'employee',
      department_id: 'dept-eng',
      manager_id: 'user-admin-1',
      position: 'Engineering Lead',
      phone: '+1 (415) 890-2101',
      joining_date: '2023-06-01',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'user-emp-2',
      employee_code: 'BRX-105',
      name: 'Marcus Reed',
      email: 'marcus.reed@buildrex.com',
      password_hash: defaultPasswordHash,
      role: 'employee',
      department_id: 'dept-ux',
      manager_id: 'user-admin-1',
      position: 'Senior Product Designer',
      phone: '+1 (415) 890-2102',
      joining_date: '2024-02-15',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'user-int-1',
      employee_code: 'BRX-INT-01',
      name: 'Devin Patel',
      email: 'intern.dev@buildrex.com',
      password_hash: defaultPasswordHash,
      role: 'intern',
      department_id: 'dept-eng',
      manager_id: 'user-emp-1',
      position: 'Frontend Engineering Intern',
      phone: '+1 (415) 890-2103',
      joining_date: '2026-06-01',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'user-int-2',
      employee_code: 'BRX-INT-02',
      name: 'Priya Sharma',
      email: 'priya.sharma@buildrex.com',
      password_hash: defaultPasswordHash,
      role: 'intern',
      department_id: 'dept-ai',
      manager_id: 'user-emp-1',
      position: 'AI Research Intern',
      phone: '+1 (415) 890-2104',
      joining_date: '2026-06-15',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'user-int-3',
      employee_code: 'BRX-INT-03',
      name: 'Liam Ross',
      email: 'liam.ross@buildrex.com',
      password_hash: defaultPasswordHash,
      role: 'intern',
      department_id: 'dept-ops',
      manager_id: 'user-admin-1',
      position: 'Business Operations Intern',
      phone: '+1 (415) 890-2105',
      joining_date: '2026-07-01',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  // Company Settings
  const company_settings: CompanySettings = {
    id: 1,
    company_name: 'BUILDREX Technologies Inc.',
    work_start_time: '09:00',
    work_end_time: '18:00',
    grace_period_minutes: 15,
    half_day_minutes: 240, // 4 hours
    full_day_minutes: 480, // 8 hours
    timezone: 'America/Los_Angeles',
    allow_breaks: true,
    updated_at: nowIso,
  };

  const holidays: Holiday[] = [
    {
      id: 'hol-1',
      name: 'Labor Day',
      date: '2026-09-07',
      description: 'Official company paid holiday',
      created_at: nowIso,
    },
    {
      id: 'hol-2',
      name: 'BUILDREX Annual Summit Day',
      date: '2026-10-30',
      description: 'Annual corporate innovation retreat',
      created_at: nowIso,
    },
    {
      id: 'hol-3',
      name: 'Thanksgiving Day',
      date: '2026-11-26',
      description: 'National holiday',
      created_at: nowIso,
    },
  ];

  // Past attendance records for realistic statistics
  const attendance: AttendanceRecord[] = [];
  const work_updates: WorkUpdate[] = [];

  // Generate 10 days of past records
  const sampleUsers = [users[1], users[2], users[3], users[4], users[5]];
  const currentDate = new Date();

  for (let d = 10; d >= 1; d--) {
    const pastDate = new Date(currentDate);
    pastDate.setDate(pastDate.getDate() - d);
    // Skip weekends
    if (pastDate.getDay() === 0 || pastDate.getDay() === 6) continue;

    const dateStr = pastDate.toISOString().split('T')[0];

    sampleUsers.forEach((u, idx) => {
      // simulate Sarah, Devin, Priya, Liam, Marcus
      const isLate = (idx + d) % 4 === 0;
      const inHour = isLate ? '09:25:00' : '08:55:00';
      const outHour = '17:35:00';
      const checkInIso = `${dateStr}T${inHour}Z`;
      const checkOutIso = `${dateStr}T${outHour}Z`;
      const totalMinutes = isLate ? 490 : 520;

      attendance.push({
        id: `att-${u.id}-${dateStr}`,
        user_id: u.id,
        work_date: dateStr,
        check_in: checkInIso,
        check_out: checkOutIso,
        total_minutes: totalMinutes,
        status: isLate ? 'late' : 'present',
        notes: isLate ? 'Late arrival past 9:15 AM grace window' : 'Normal shift completed',
        created_at: checkInIso,
        updated_at: checkOutIso,
      });

      // Also add submitted work update for past days
      work_updates.push({
        id: `wu-${u.id}-${dateStr}`,
        user_id: u.id,
        work_date: dateStr,
        tasks_completed: `- Implemented module sprint features\n- Code reviews and API integration\n- Resolved staging issue #482`,
        project_details: `BUILDREX Core Platform & Microservices`,
        accomplishments: `All unit tests passing with 98% coverage`,
        blockers: `None encountered`,
        next_day_plan: `Begin telemetry dashboards and database indexing`,
        hours_spent: 8.0,
        status: d > 2 ? 'reviewed' : 'submitted',
        submitted_at: `${dateStr}T17:30:00Z`,
        reviewed_by: d > 2 ? 'user-admin-1' : null,
        review_comment: d > 2 ? 'Solid velocity and clear daily documentation. Keep up the high standard.' : null,
        reviewed_at: d > 2 ? `${dateStr}T18:00:00Z` : null,
        created_at: `${dateStr}T17:30:00Z`,
        updated_at: `${dateStr}T18:00:00Z`,
      });
    });
  }

  // Today's attendance: Sarah Chen & Devin Patel already checked in
  attendance.push({
    id: `att-sarah-today`,
    user_id: 'user-emp-1',
    work_date: today,
    check_in: `${today}T08:52:00Z`,
    check_out: null,
    total_minutes: 0,
    status: 'present',
    created_at: `${today}T08:52:00Z`,
    updated_at: `${today}T08:52:00Z`,
  });

  attendance.push({
    id: `att-devin-today`,
    user_id: 'user-int-1',
    work_date: today,
    check_in: `${today}T09:05:00Z`,
    check_out: null,
    total_minutes: 0,
    status: 'present',
    created_at: `${today}T09:05:00Z`,
    updated_at: `${today}T09:05:00Z`,
  });

  const leave_requests: LeaveRequest[] = [
    {
      id: 'leave-1',
      user_id: 'user-int-2', // Priya
      leave_type: 'sick',
      start_date: '2026-10-18',
      end_date: '2026-10-19',
      days_count: 2,
      reason: 'Medical checkup and recovery period',
      status: 'pending',
      reviewed_by: null,
      review_comment: null,
      reviewed_at: null,
      created_at: nowIso,
    },
    {
      id: 'leave-2',
      user_id: 'user-emp-2', // Marcus
      leave_type: 'casual',
      start_date: '2026-10-25',
      end_date: '2026-10-26',
      days_count: 2,
      reason: 'Family event out of town',
      status: 'approved',
      reviewed_by: 'user-admin-1',
      review_comment: 'Approved. Ensure handoff document is shared.',
      reviewed_at: nowIso,
      created_at: nowIso,
    },
  ];

  const attendance_corrections: AttendanceCorrection[] = [
    {
      id: 'corr-1',
      user_id: 'user-int-3',
      attendance_id: 'att-user-int-3-sample',
      work_date: '2026-10-09',
      requested_check_in: '2026-10-09T08:58:00Z',
      requested_check_out: '2026-10-09T18:15:00Z',
      reason: 'Forgot to click Check Out on workstation before leaving for client meeting',
      status: 'pending',
      reviewed_by: null,
      review_comment: null,
      reviewed_at: null,
      created_at: nowIso,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      user_id: 'user-admin-1',
      title: 'New Leave Request Submitted',
      message: 'Priya Sharma (BRX-INT-02) submitted a Sick Leave request for Oct 18-19.',
      type: 'info',
      read_at: null,
      link: '/admin/leave-requests',
      created_at: nowIso,
    },
    {
      id: 'notif-2',
      user_id: 'user-admin-1',
      title: 'Attendance Correction Requested',
      message: 'Liam Ross (BRX-INT-03) requested correction for Oct 09.',
      type: 'warning',
      read_at: null,
      link: '/admin/leave-requests',
      created_at: nowIso,
    },
    {
      id: 'notif-3',
      user_id: 'user-int-1',
      title: 'Welcome to BUILDREX Portal',
      message: 'Your biometric & work management profile is active. Remember to submit your daily report by 6:00 PM.',
      type: 'info',
      read_at: null,
      link: '/dashboard',
      created_at: nowIso,
    },
  ];

  const audit_logs: AuditLogItem[] = [
    {
      id: 'audit-1',
      actor_id: 'user-admin-1',
      actor_name: 'Alex Vance',
      action: 'SYSTEM_INITIALIZATION',
      entity_type: 'SYSTEM',
      entity_id: 'BUILDREX-SYSTEM',
      details: { version: '1.0.0', initialized_tables: 10 },
      ip_address: '127.0.0.1',
      created_at: nowIso,
    },
    {
      id: 'audit-2',
      actor_id: 'user-admin-1',
      actor_name: 'Alex Vance',
      action: 'APPROVE_LEAVE',
      entity_type: 'LEAVE_REQUEST',
      entity_id: 'leave-2',
      details: { user: 'Marcus Reed', days: 2 },
      ip_address: '127.0.0.1',
      created_at: nowIso,
    },
  ];

  return {
    users,
    departments,
    attendance,
    work_updates,
    leave_requests,
    attendance_corrections,
    notifications,
    audit_logs,
    company_settings,
    holidays,
  };
}

export function getDb(): DatabaseSchema {
  if (dbInstance) {
    return dbInstance;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      return dbInstance!;
    } catch {
      // fallback to re-seeding if corrupted
    }
  }

  dbInstance = generateInitialSeed();
  saveDb(dbInstance);
  return dbInstance;
}

let isTiDBActive = false;

export function isTiDBConnected(): boolean {
  return isTiDBActive;
}

export function saveDbLocalOnly(data: DatabaseSchema): void {
  dbInstance = data;
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function saveDb(data: DatabaseSchema): void {
  saveDbLocalOnly(data);

  // If TiDB Cloud is connected, synchronize asynchronously to avoid blocking the HTTP request
  if (isTiDBActive) {
    syncAllToTiDB(data).catch((err) => {
      console.warn('[TiDB] Background sync warning:', err.message);
    });
  }
}

/**
 * Initialize backend database.
 * If TiDB Cloud is configured, connects, runs migrations, seeds or loads tables.
 * Falls back gracefully to JSON file storage if offline or not configured.
 */
export async function initDatabase(): Promise<{ engine: 'tidb' | 'json'; message: string }> {
  // First load local JSON store as fast initial baseline
  getDb();

  if (!isTiDBConfigured()) {
    console.log('[Database] 📁 TiDB credentials not found in .env. Operating in local JSON storage mode.');
    isTiDBActive = false;
    return { engine: 'json', message: 'Operating in local JSON storage mode.' };
  }

  try {
    const ok = await initializeTiDB();
    if (ok) {
      isTiDBActive = true;
      const tidbData = await loadAllFromTiDB();
      if (tidbData && tidbData.users.length > 0) {
        dbInstance = tidbData;
        saveDbLocalOnly(dbInstance);
        console.log(`[Database] ☁️ Loaded ${dbInstance.users.length} users and ${dbInstance.attendance.length} attendance rows from TiDB Cloud.`);
        return { engine: 'tidb', message: 'Connected to TiDB Cloud and loaded active dataset.' };
      } else {
        // TiDB tables empty, seed with current dataset
        console.log('[Database] ☁️ Seeding TiDB Cloud tables with system dataset...');
        await syncAllToTiDB(dbInstance!);
        return { engine: 'tidb', message: 'Connected to TiDB Cloud and seeded initial tables.' };
      }
    } else {
      isTiDBActive = false;
      return { engine: 'json', message: 'Failed to connect to TiDB Cloud. Falling back to local JSON.' };
    }
  } catch (err: any) {
    console.warn('[Database] TiDB initialization error:', err.message);
    isTiDBActive = false;
    return { engine: 'json', message: `TiDB error: ${err.message}. Operating in JSON fallback mode.` };
  }
}

export { getTiDBStatus, syncAllToTiDB, runMigrations, ensureDatabaseExists };


// ----------------- Data Access Helpers -----------------

export function logAudit(
  actor: { id: string | null; name: string },
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> | null,
  ip = '127.0.0.1'
) {
  const db = getDb();
  const log: AuditLogItem = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actor_id: actor.id,
    actor_name: actor.name,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: ip,
    created_at: new Date().toISOString(),
  };
  db.audit_logs.unshift(log);
  // Cap audit logs to 500 items
  if (db.audit_logs.length > 500) {
    db.audit_logs.length = 500;
  }
  saveDb(db);
  return log;
}

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'alert' = 'info',
  link?: string
) {
  const db = getDb();
  const notif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    title,
    message,
    type,
    read_at: null,
    link,
    created_at: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  saveDb(db);
  return notif;
}

export function enrichUser(user: User): User {
  const db = getDb();
  const dept = db.departments.find((d) => d.id === user.department_id);
  const manager = db.users.find((u) => u.id === user.manager_id);
  return {
    ...user,
    department_name: dept?.name || 'Unassigned',
    manager_name: manager?.name || 'None',
  };
}

export function enrichAttendance(rec: AttendanceRecord): AttendanceRecord {
  const db = getDb();
  const user = db.users.find((u) => u.id === rec.user_id);
  const dept = user?.department_id ? db.departments.find((d) => d.id === user.department_id) : undefined;
  return {
    ...rec,
    user_name: user?.name || 'Unknown',
    employee_code: user?.employee_code || '---',
    role: user?.role,
    department_name: dept?.name || 'Unassigned',
  };
}

export function enrichWorkUpdate(rec: WorkUpdate): WorkUpdate {
  const db = getDb();
  const user = db.users.find((u) => u.id === rec.user_id);
  const reviewer = rec.reviewed_by ? db.users.find((u) => u.id === rec.reviewed_by) : undefined;
  const dept = user?.department_id ? db.departments.find((d) => d.id === user.department_id) : undefined;
  return {
    ...rec,
    user_name: user?.name || 'Unknown',
    employee_code: user?.employee_code || '---',
    role: user?.role,
    department_name: dept?.name || 'Unassigned',
    reviewer_name: reviewer?.name,
  };
}

export function enrichLeave(rec: LeaveRequest): LeaveRequest {
  const db = getDb();
  const user = db.users.find((u) => u.id === rec.user_id);
  const reviewer = rec.reviewed_by ? db.users.find((u) => u.id === rec.reviewed_by) : undefined;
  const dept = user?.department_id ? db.departments.find((d) => d.id === user.department_id) : undefined;
  return {
    ...rec,
    user_name: user?.name || 'Unknown',
    employee_code: user?.employee_code || '---',
    role: user?.role,
    department_name: dept?.name || 'Unassigned',
    reviewer_name: reviewer?.name,
  };
}

export function enrichCorrection(rec: AttendanceCorrection): AttendanceCorrection {
  const db = getDb();
  const user = db.users.find((u) => u.id === rec.user_id);
  const reviewer = rec.reviewed_by ? db.users.find((u) => u.id === rec.reviewed_by) : undefined;
  const dept = user?.department_id ? db.departments.find((d) => d.id === user.department_id) : undefined;
  return {
    ...rec,
    user_name: user?.name || 'Unknown',
    employee_code: user?.employee_code || '---',
    role: user?.role,
    department_name: dept?.name || 'Unassigned',
    reviewer_name: reviewer?.name,
  };
}

export function calculateAttendanceStatus(
  checkInDate: Date,
  settings: CompanySettings
): { status: AttendanceRecord['status']; isLate: boolean } {
  // Parse work_start_time HH:MM
  const [startH, startM] = settings.work_start_time.split(':').map(Number);
  const graceMinutes = settings.grace_period_minutes || 15;

  const scheduledStart = new Date(checkInDate);
  scheduledStart.setHours(startH, startM, 0, 0);

  const graceThreshold = new Date(scheduledStart.getTime() + graceMinutes * 60 * 1000);

  const isLate = checkInDate > graceThreshold;
  return {
    status: isLate ? 'late' : 'present',
    isLate,
  };
}

export function getTodayStr(): string {
  return getTodayDateString();
}
