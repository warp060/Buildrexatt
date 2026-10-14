import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
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
} from './types';

// ─────────────────────────────────────────────────────────────────
// TiDB Cloud Connection & Integration Module
// ─────────────────────────────────────────────────────────────────
// TiDB is a distributed, MySQL-compatible HTAP cloud database.
// This module provides:
// 1. SSL-encrypted connection pooling to TiDB Cloud Serverless / Dedicated
// 2. Schema auto-migration (10 relational tables)
// 3. Enterprise seed generation
// 4. Bidirectional data sync between in-memory cache and TiDB tables
// 5. Diagnostics, health check, latency monitoring, and row counters
// ─────────────────────────────────────────────────────────────────

let pool: Pool | null = null;
let isConnected = false;
let activeEngine: 'tidb' | 'json' = 'json';
let lastLatencyMs: number | null = null;
let serverVersion: string | null = null;

export interface TiDBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface TiDBStatus {
  configured: boolean;
  connected: boolean;
  engine: 'tidb' | 'json';
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  version: string | null;
  latencyMs: number | null;
  tableCounts?: Record<string, number>;
  error?: string | null;
}

/**
 * Check if TiDB Cloud credentials are configured in environment variables.
 */
export function isTiDBConfigured(): boolean {
  return Boolean(
    process.env.TIDB_HOST &&
    process.env.TIDB_USER &&
    process.env.TIDB_DATABASE
  );
}

/**
 * Extract configuration from environment variables.
 */
export function getConfig(): TiDBConfig {
  return {
    host: process.env.TIDB_HOST || '127.0.0.1',
    port: parseInt(process.env.TIDB_PORT || '4000', 10),
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'buildrex',
    ssl: process.env.TIDB_SSL !== 'false', // Default true for TiDB Cloud
  };
}

/**
 * Ensure target database exists in TiDB Cloud.
 * Connects without specifying database and executes CREATE DATABASE IF NOT EXISTS.
 */
export async function ensureDatabaseExists(customConfig?: TiDBConfig): Promise<boolean> {
  const config = customConfig || getConfig();
  try {
    const tempConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    });
    try {
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
      return true;
    } finally {
      await tempConn.end().catch(() => {});
    }
  } catch (err: any) {
    console.warn(`[TiDB] Database existence check notice:`, err.message);
    return false;
  }
}

/**
 * Get or create MySQL connection pool for TiDB.
 */
export function getPool(customConfig?: TiDBConfig): Pool {
  if (pool && !customConfig) return pool;

  const config = customConfig || getConfig();

  const newPool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: '+00:00',
    dateStrings: true,
  });

  if (!customConfig) {
    pool = newPool;
  }
  return newPool;
}

/**
 * Measure latency and verify connection to TiDB Cloud.
 */
export async function verifyConnection(targetPool?: Pool): Promise<{
  ok: boolean;
  version?: string;
  latencyMs?: number;
  error?: string;
}> {
  if (!targetPool) {
    await ensureDatabaseExists().catch(() => {});
  }
  const p = targetPool || getPool();
  const startTime = Date.now();

  try {
    const conn = await p.getConnection();
    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        'SELECT VERSION() AS version, NOW() AS server_time'
      );
      const latency = Date.now() - startTime;
      const ver = rows[0]?.version || 'TiDB Compatible';

      if (!targetPool) {
        isConnected = true;
        activeEngine = 'tidb';
        lastLatencyMs = latency;
        serverVersion = ver;
      }

      console.log(`[TiDB] Connected to TiDB v${ver} (latency: ${latency}ms)`);
      return { ok: true, version: ver, latencyMs: latency };
    } finally {
      conn.release();
    }
  } catch (err: any) {
    if (!targetPool) {
      isConnected = false;
      activeEngine = 'json';
    }
    console.warn('[TiDB] Connection check failed:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * SQL Schema Migration — creates all 10 relational tables.
 */
export async function runMigrations(targetPool?: Pool): Promise<void> {
  console.log('[TiDB] Running schema migrations...');
  const p = targetPool || getPool();
  const conn = await p.getConnection();

  try {
    const tableDefinitions = [
      // 1. Departments
      `CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        description TEXT,
        manager_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_dept_name (name),
        UNIQUE KEY uq_dept_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 2. Users
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        employee_code VARCHAR(30) NOT NULL,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee', 'intern') NOT NULL DEFAULT 'employee',
        department_id VARCHAR(36),
        manager_id VARCHAR(36),
        position VARCHAR(100),
        phone VARCHAR(30),
        joining_date DATE NOT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_employee_code (employee_code),
        UNIQUE KEY uq_email (email),
        KEY idx_users_role (role),
        KEY idx_users_status (status),
        KEY idx_users_dept (department_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 3. Attendance
      `CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        work_date DATE NOT NULL,
        check_in DATETIME NOT NULL,
        check_out DATETIME NULL,
        total_minutes INT UNSIGNED DEFAULT 0,
        status ENUM('present', 'late', 'half_day', 'absent', 'incomplete') NOT NULL DEFAULT 'present',
        ip_address VARCHAR(45),
        notes VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_work_date (user_id, work_date),
        KEY idx_attendance_date (work_date),
        KEY idx_attendance_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 4. Daily Work Updates
      `CREATE TABLE IF NOT EXISTS work_updates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        work_date DATE NOT NULL,
        tasks_completed TEXT NOT NULL,
        project_details VARCHAR(255) NOT NULL,
        accomplishments TEXT,
        blockers TEXT,
        next_day_plan TEXT,
        hours_spent DECIMAL(4,1) DEFAULT 8.0,
        status ENUM('draft', 'submitted', 'reviewed', 'needs_revision') NOT NULL DEFAULT 'submitted',
        submitted_at DATETIME NULL,
        reviewed_by VARCHAR(36) NULL,
        review_comment TEXT,
        reviewed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_work_update_user_date (user_id, work_date),
        KEY idx_work_updates_status (status),
        KEY idx_work_updates_date (work_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 5. Leave Requests
      `CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        leave_type ENUM('casual', 'sick', 'paid', 'unpaid', 'emergency') NOT NULL DEFAULT 'casual',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_count INT UNSIGNED NOT NULL DEFAULT 1,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        reviewed_by VARCHAR(36) NULL,
        review_comment TEXT,
        reviewed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_leave_status (status),
        KEY idx_leave_dates (start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 6. Attendance Corrections
      `CREATE TABLE IF NOT EXISTS attendance_corrections (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        attendance_id VARCHAR(36) NOT NULL,
        work_date DATE NULL,
        requested_check_in DATETIME NOT NULL,
        requested_check_out DATETIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        reviewed_by VARCHAR(36) NULL,
        review_comment TEXT,
        reviewed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_correction_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 7. Notifications
      `CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'alert') NOT NULL DEFAULT 'info',
        read_at DATETIME NULL,
        link VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_notif_user_read (user_id, read_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 8. Audit Logs
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        actor_id VARCHAR(36) NULL,
        actor_name VARCHAR(120) NOT NULL,
        action VARCHAR(80) NOT NULL,
        entity_type VARCHAR(60) NOT NULL,
        entity_id VARCHAR(60) NOT NULL,
        details JSON NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_audit_created (created_at),
        KEY idx_audit_actor (actor_id),
        KEY idx_audit_entity (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 9. Company Settings
      `CREATE TABLE IF NOT EXISTS company_settings (
        id INT PRIMARY KEY DEFAULT 1,
        company_name VARCHAR(120) NOT NULL DEFAULT 'BUILDREX Technologies Inc.',
        work_start_time TIME NOT NULL DEFAULT '09:00:00',
        work_end_time TIME NOT NULL DEFAULT '18:00:00',
        grace_period_minutes INT UNSIGNED NOT NULL DEFAULT 15,
        half_day_minutes INT UNSIGNED NOT NULL DEFAULT 240,
        full_day_minutes INT UNSIGNED NOT NULL DEFAULT 480,
        timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
        allow_breaks BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // 10. Holidays
      `CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_holiday_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ];

    for (const sql of tableDefinitions) {
      await conn.query(sql);
    }

    console.log('[TiDB] ✅ All 10 tables verified and ready in TiDB Cloud.');
  } finally {
    conn.release();
  }
}

/**
 * Helper to convert ISO string to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
 */
function toSqlDateTime(isoStr: string | null | undefined): string | null {
  if (!isoStr) return null;
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return null;
  }
}

/**
 * Count rows across all 10 tables.
 */
export async function getTableCounts(targetPool?: Pool): Promise<Record<string, number>> {
  const p = targetPool || getPool();
  const tables = [
    'departments',
    'users',
    'attendance',
    'work_updates',
    'leave_requests',
    'attendance_corrections',
    'notifications',
    'audit_logs',
    'company_settings',
    'holidays',
  ];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const [rows] = await p.query<RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM ${table}`);
      counts[table] = Number(rows[0]?.cnt || 0);
    } catch {
      counts[table] = 0;
    }
  }
  return counts;
}

/**
 * Load all data from TiDB Cloud into the memory cache.
 */
export async function loadAllFromTiDB(): Promise<{
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
} | null> {
  if (!isConnected && !(await verifyConnection()).ok) {
    return null;
  }

  const p = getPool();
  try {
    const [departmentsRows] = await p.query<RowDataPacket[]>('SELECT * FROM departments ORDER BY created_at ASC');
    const [usersRows] = await p.query<RowDataPacket[]>('SELECT * FROM users ORDER BY created_at ASC');
    const [attendanceRows] = await p.query<RowDataPacket[]>('SELECT * FROM attendance ORDER BY work_date DESC, check_in DESC');
    const [workUpdatesRows] = await p.query<RowDataPacket[]>('SELECT * FROM work_updates ORDER BY work_date DESC, created_at DESC');
    const [leaveRows] = await p.query<RowDataPacket[]>('SELECT * FROM leave_requests ORDER BY created_at DESC');
    const [correctionRows] = await p.query<RowDataPacket[]>('SELECT * FROM attendance_corrections ORDER BY created_at DESC');
    const [notifRows] = await p.query<RowDataPacket[]>('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
    const [auditRows] = await p.query<RowDataPacket[]>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
    const [settingsRows] = await p.query<RowDataPacket[]>('SELECT * FROM company_settings WHERE id = 1 LIMIT 1');
    const [holidaysRows] = await p.query<RowDataPacket[]>('SELECT * FROM holidays ORDER BY date ASC');

    const defaultSettings: CompanySettings = {
      id: 1,
      company_name: 'BUILDREX Technologies Inc.',
      work_start_time: '09:00:00',
      work_end_time: '18:00:00',
      grace_period_minutes: 15,
      half_day_minutes: 240,
      full_day_minutes: 480,
      timezone: 'America/Los_Angeles',
      allow_breaks: true,
      updated_at: new Date().toISOString(),
    };

    const company_settings: CompanySettings = settingsRows[0]
      ? {
          id: Number(settingsRows[0].id) || 1,
          company_name: settingsRows[0].company_name,
          work_start_time: settingsRows[0].work_start_time,
          work_end_time: settingsRows[0].work_end_time,
          grace_period_minutes: settingsRows[0].grace_period_minutes,
          half_day_minutes: settingsRows[0].half_day_minutes,
          full_day_minutes: settingsRows[0].full_day_minutes,
          timezone: settingsRows[0].timezone,
          allow_breaks: Boolean(settingsRows[0].allow_breaks),
          updated_at: settingsRows[0].updated_at || new Date().toISOString(),
        }
      : defaultSettings;

    return {
      departments: departmentsRows.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description || '',
        manager_id: r.manager_id || null,
        created_at: r.created_at,
      })),
      users: usersRows.map((r: any) => ({
        id: r.id,
        employee_code: r.employee_code,
        name: r.name,
        email: r.email,
        password_hash: r.password_hash,
        role: r.role,
        department_id: r.department_id || null,
        manager_id: r.manager_id || null,
        position: r.position || '',
        phone: r.phone || '',
        joining_date: r.joining_date,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
      })),
      attendance: attendanceRows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        work_date: r.work_date,
        check_in: r.check_in,
        check_out: r.check_out || null,
        total_minutes: r.total_minutes || 0,
        status: r.status,
        notes: r.notes || undefined,
        ip_address: r.ip_address || '127.0.0.1',
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      work_updates: workUpdatesRows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        work_date: r.work_date,
        tasks_completed: r.tasks_completed,
        project_details: r.project_details,
        accomplishments: r.accomplishments || '',
        blockers: r.blockers || '',
        next_day_plan: r.next_day_plan || '',
        hours_spent: Number(r.hours_spent) || 8,
        status: r.status,
        submitted_at: r.submitted_at || null,
        reviewed_by: r.reviewed_by || null,
        review_comment: r.review_comment || null,
        reviewed_at: r.reviewed_at || null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      leave_requests: leaveRows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        days_count: r.days_count,
        reason: r.reason,
        status: r.status,
        reviewed_by: r.reviewed_by || null,
        review_comment: r.review_comment || null,
        reviewed_at: r.reviewed_at || null,
        created_at: r.created_at,
      })),
      attendance_corrections: correctionRows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        attendance_id: r.attendance_id,
        work_date: r.work_date || null,
        requested_check_in: r.requested_check_in,
        requested_check_out: r.requested_check_out,
        reason: r.reason,
        status: r.status,
        reviewed_by: r.reviewed_by || null,
        review_comment: r.review_comment || null,
        reviewed_at: r.reviewed_at || null,
        created_at: r.created_at,
      })),
      notifications: notifRows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        message: r.message,
        type: r.type,
        read_at: r.read_at || null,
        link: r.link || null,
        created_at: r.created_at,
      })),
      audit_logs: auditRows.map((r: any) => {
        let details = null;
        if (r.details) {
          try {
            details = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
          } catch {
            details = r.details;
          }
        }
        return {
          id: r.id,
          actor_id: r.actor_id || null,
          actor_name: r.actor_name,
          action: r.action,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          details,
          ip_address: r.ip_address || '127.0.0.1',
          created_at: r.created_at,
        };
      }),
      company_settings,
      holidays: holidaysRows.map((r: any) => ({
        id: r.id,
        name: r.name,
        date: r.date,
        description: r.description || '',
        created_at: r.created_at,
      })),
    };
  } catch (err: any) {
    console.error('[TiDB] Error loading data from TiDB:', err.message);
    return null;
  }
}

/**
 * Synchronize full local dataset to TiDB Cloud using SQL upserts.
 */
export async function syncAllToTiDB(data: {
  departments: Department[];
  users: User[];
  attendance: AttendanceRecord[];
  work_updates: WorkUpdate[];
  leave_requests: LeaveRequest[];
  attendance_corrections: AttendanceCorrection[];
  notifications: NotificationItem[];
  audit_logs: AuditLogItem[];
  company_settings: CompanySettings;
  holidays: Holiday[];
}): Promise<{ ok: boolean; message: string }> {
  if (!isConnected && !(await verifyConnection()).ok) {
    return { ok: false, message: 'Cannot connect to TiDB Cloud cluster.' };
  }

  const p = getPool();
  const conn = await p.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Departments
    for (const d of data.departments) {
      await conn.query(
        `INSERT INTO departments (id, name, code, description, manager_id)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code), description=VALUES(description), manager_id=VALUES(manager_id)`,
        [d.id, d.name, d.code, d.description || null, d.manager_id || null]
      );
    }

    // 2. Users
    for (const u of data.users) {
      await conn.query(
        `INSERT INTO users (id, employee_code, name, email, password_hash, role, department_id, manager_id, position, phone, joining_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role=VALUES(role), department_id=VALUES(department_id), manager_id=VALUES(manager_id), position=VALUES(position), phone=VALUES(phone), status=VALUES(status)`,
        [
          u.id,
          u.employee_code,
          u.name,
          u.email,
          u.password_hash,
          u.role,
          u.department_id || null,
          u.manager_id || null,
          u.position || null,
          u.phone || null,
          u.joining_date,
          u.status,
        ]
      );
    }

    // 3. Attendance
    for (const a of data.attendance) {
      await conn.query(
        `INSERT INTO attendance (id, user_id, work_date, check_in, check_out, total_minutes, status, ip_address, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE check_out=VALUES(check_out), total_minutes=VALUES(total_minutes), status=VALUES(status), notes=VALUES(notes)`,
        [
          a.id,
          a.user_id,
          a.work_date,
          toSqlDateTime(a.check_in),
          toSqlDateTime(a.check_out),
          a.total_minutes || 0,
          a.status,
          a.ip_address || null,
          a.notes || null,
        ]
      );
    }

    // 4. Work Updates
    for (const w of data.work_updates) {
      await conn.query(
        `INSERT INTO work_updates (id, user_id, work_date, tasks_completed, project_details, accomplishments, blockers, next_day_plan, hours_spent, status, submitted_at, reviewed_by, review_comment, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE tasks_completed=VALUES(tasks_completed), project_details=VALUES(project_details), accomplishments=VALUES(accomplishments), blockers=VALUES(blockers), next_day_plan=VALUES(next_day_plan), hours_spent=VALUES(hours_spent), status=VALUES(status), reviewed_by=VALUES(reviewed_by), review_comment=VALUES(review_comment), reviewed_at=VALUES(reviewed_at)`,
        [
          w.id,
          w.user_id,
          w.work_date,
          w.tasks_completed,
          w.project_details,
          w.accomplishments || null,
          w.blockers || null,
          w.next_day_plan || null,
          w.hours_spent || 8,
          w.status,
          toSqlDateTime(w.submitted_at),
          w.reviewed_by || null,
          w.review_comment || null,
          toSqlDateTime(w.reviewed_at),
        ]
      );
    }

    // 5. Leave Requests
    for (const l of data.leave_requests) {
      await conn.query(
        `INSERT INTO leave_requests (id, user_id, leave_type, start_date, end_date, days_count, reason, status, reviewed_by, review_comment, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), reviewed_by=VALUES(reviewed_by), review_comment=VALUES(review_comment), reviewed_at=VALUES(reviewed_at)`,
        [
          l.id,
          l.user_id,
          l.leave_type,
          l.start_date,
          l.end_date,
          l.days_count,
          l.reason,
          l.status,
          l.reviewed_by || null,
          l.review_comment || null,
          toSqlDateTime(l.reviewed_at),
        ]
      );
    }

    // 6. Attendance Corrections
    for (const c of data.attendance_corrections) {
      await conn.query(
        `INSERT INTO attendance_corrections (id, user_id, attendance_id, work_date, requested_check_in, requested_check_out, reason, status, reviewed_by, review_comment, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), reviewed_by=VALUES(reviewed_by), review_comment=VALUES(review_comment), reviewed_at=VALUES(reviewed_at)`,
        [
          c.id,
          c.user_id,
          c.attendance_id,
          c.work_date || null,
          toSqlDateTime(c.requested_check_in),
          toSqlDateTime(c.requested_check_out),
          c.reason,
          c.status,
          c.reviewed_by || null,
          c.review_comment || null,
          toSqlDateTime(c.reviewed_at),
        ]
      );
    }

    // 7. Notifications
    for (const n of data.notifications.slice(0, 100)) {
      await conn.query(
        `INSERT INTO notifications (id, user_id, title, message, type, read_at, link)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE read_at=VALUES(read_at)`,
        [n.id, n.user_id, n.title, n.message, n.type, toSqlDateTime(n.read_at), n.link || null]
      );
    }

    // 8. Audit Logs
    for (const log of data.audit_logs.slice(0, 150)) {
      await conn.query(
        `INSERT INTO audit_logs (id, actor_id, actor_name, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=VALUES(id)`,
        [
          log.id,
          log.actor_id || null,
          log.actor_name,
          log.action,
          log.entity_type,
          log.entity_id,
          log.details ? JSON.stringify(log.details) : null,
          log.ip_address || null,
        ]
      );
    }

    // 9. Company Settings
    const cs = data.company_settings;
    await conn.query(
      `INSERT INTO company_settings (id, company_name, work_start_time, work_end_time, grace_period_minutes, half_day_minutes, full_day_minutes, timezone, allow_breaks)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company_name=VALUES(company_name), work_start_time=VALUES(work_start_time), work_end_time=VALUES(work_end_time), grace_period_minutes=VALUES(grace_period_minutes), half_day_minutes=VALUES(half_day_minutes), full_day_minutes=VALUES(full_day_minutes), timezone=VALUES(timezone), allow_breaks=VALUES(allow_breaks)`,
      [
        cs.company_name,
        cs.work_start_time,
        cs.work_end_time,
        cs.grace_period_minutes,
        cs.half_day_minutes,
        cs.full_day_minutes,
        cs.timezone,
        cs.allow_breaks,
      ]
    );

    // 10. Holidays
    for (const h of data.holidays) {
      await conn.query(
        `INSERT INTO holidays (id, name, date, description)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
        [h.id, h.name, h.date, h.description || null]
      );
    }

    await conn.commit();
    console.log('[TiDB] ✅ Synchronized all records to TiDB Cloud successfully.');
    return { ok: true, message: 'All tables synced to TiDB Cloud.' };
  } catch (err: any) {
    await conn.rollback();
    console.error('[TiDB] ❌ Sync failed:', err.message);
    return { ok: false, message: err.message };
  } finally {
    conn.release();
  }
}

/**
 * Get comprehensive diagnostic status of the TiDB database connection.
 */
export async function getTiDBStatus(): Promise<TiDBStatus> {
  const config = getConfig();
  const configured = isTiDBConfigured();

  if (!configured) {
    return {
      configured: false,
      connected: false,
      engine: 'json',
      host: config.host,
      port: config.port,
      database: config.database,
      ssl: config.ssl || true,
      version: null,
      latencyMs: null,
      error: 'TiDB credentials not configured in environment variables.',
    };
  }

  const { ok, version, latencyMs, error } = await verifyConnection();

  let tableCounts: Record<string, number> | undefined;
  if (ok) {
    tableCounts = await getTableCounts();
  }

  return {
    configured: true,
    connected: ok,
    engine: ok ? 'tidb' : 'json',
    host: config.host,
    port: config.port,
    database: config.database,
    ssl: config.ssl || true,
    version: version || serverVersion,
    latencyMs: latencyMs ?? lastLatencyMs,
    tableCounts,
    error: error || null,
  };
}

/**
 * Initialize TiDB Cloud: connects, runs migrations, seeds or synchronizes.
 */
export async function initializeTiDB(): Promise<boolean> {
  if (!isTiDBConfigured()) {
    console.log('[Database] 📁 TiDB credentials not set. Running in local JSON mode.');
    activeEngine = 'json';
    return false;
  }

  console.log('[Database] 🌐 Initializing TiDB Cloud connection...');
  const { ok, version, latencyMs, error } = await verifyConnection();

  if (!ok) {
    console.warn(`[Database] ⚠️ TiDB connection failed (${error}). Falling back to local JSON store.`);
    activeEngine = 'json';
    return false;
  }

  console.log(`[Database] 🚀 TiDB Cloud connected (v${version}, ${latencyMs}ms latency).`);
  activeEngine = 'tidb';

  await runMigrations();
  return true;
}

/**
 * Close database pool on server exit.
 */
export async function closeTiDB(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
    activeEngine = 'json';
    console.log('[TiDB] Connection pool terminated.');
  }
}
