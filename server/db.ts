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
  clearAllTiDBTables,
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

// Ensure directory exists if filesystem is writable
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem in serverless environments (Vercel)
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

import { generateSeedDatabase } from './sheetSeedData';

function generateInitialSeed(): DatabaseSchema {
  return generateSeedDatabase();
}

export function getDb(): DatabaseSchema {
  if (dbInstance) {
    return dbInstance;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure local file has the real Google Sheet team (15+ members including Ehsaan) and none of the removed users
      const hasRemovedUsers = parsed.users.some((u: any) => [
        'layeequeahmed602@gmail.com',
        'nmuhammadshees11@gmail.com',
        'syedmdaakif007@gmail.com',
        'sajidahmedrs10@gmail.com',
        'muzammilaamirmuzzu@gmail.com',
        'vmohammedsaad@gmail.com',
        'mohammedaffan1506@gmail.com',
      ].includes(u.email));

      const adminCount = parsed.users.filter((u: any) => u.role === 'admin').length;
      const hasOnlyAdminBrx = adminCount === 1 && parsed.users.some((u: any) => u.email === 'adminbrx@gmail.com' && u.role === 'admin');

      if (
        parsed &&
        Array.isArray(parsed.users) &&
        parsed.users.length >= 15 &&
        parsed.users.some((u: any) => u.email === 'ehsaanehsaan61@gmail.com') &&
        hasOnlyAdminBrx &&
        !hasRemovedUsers
      ) {
        dbInstance = parsed;
        return dbInstance!;
      }
    } catch {
      // fallback to re-seeding if corrupted
    }
  }

  dbInstance = generateInitialSeed();
  saveDbLocalOnly(dbInstance);
  return dbInstance;
}

let isTiDBActive = false;

export function isTiDBConnected(): boolean {
  return isTiDBActive;
}

export function saveDbLocalOnly(data: DatabaseSchema): void {
  dbInstance = data;
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err: any) {
    // In serverless environments (Vercel), repository filesystem is read-only.
    // In-memory dbInstance remains authoritative and TiDB Cloud handles persistence.
    try {
      const tmpFile = path.join('/tmp', 'buildrex.json');
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ignore filesystem write error in serverless environments
    }
  }
}

let isSyncingToTiDB = false;
let pendingSyncData: DatabaseSchema | null = null;

async function runSerializedTiDBSync(data: DatabaseSchema): Promise<void> {
  if (isSyncingToTiDB) {
    pendingSyncData = data;
    return;
  }
  isSyncingToTiDB = true;
  try {
    await syncAllToTiDB(data);
  } catch (err: any) {
    console.warn('[TiDB] Background sync warning:', err.message);
  } finally {
    isSyncingToTiDB = false;
    if (pendingSyncData) {
      const nextData = pendingSyncData;
      pendingSyncData = null;
      runSerializedTiDBSync(nextData).catch(() => {});
    }
  }
}

export function saveDb(data: DatabaseSchema): void {
  saveDbLocalOnly(data);

  // If TiDB Cloud is connected, synchronize asynchronously via serialized queue
  if (isTiDBActive) {
    runSerializedTiDBSync(data).catch((err) => {
      console.warn('[TiDB] Background sync queue error:', err.message);
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
      const hasRealSheetUsers = tidbData && tidbData.users.some((u) => u.email === 'ehsaanehsaan61@gmail.com');
      const hasRemovedFromTiDB = tidbData && tidbData.users.some((u) => [
        'layeequeahmed602@gmail.com',
        'nmuhammadshees11@gmail.com',
        'syedmdaakif007@gmail.com',
        'sajidahmedrs10@gmail.com',
        'muzammilaamirmuzzu@gmail.com',
        'vmohammedsaad@gmail.com',
        'mohammedaffan1506@gmail.com',
      ].includes(u.email));

      const tidbAdminCount = tidbData ? tidbData.users.filter((u) => u.role === 'admin').length : 0;
      const hasOnlyAdminBrxInTiDB = tidbAdminCount === 1 && (tidbData ? tidbData.users.some((u) => u.email === 'adminbrx@gmail.com' && u.role === 'admin') : false);

      if (tidbData && tidbData.users.length >= 15 && hasRealSheetUsers && hasOnlyAdminBrxInTiDB && !hasRemovedFromTiDB) {
        dbInstance = tidbData;
        saveDbLocalOnly(dbInstance);
        console.log(`[Database] ☁️ Loaded ${dbInstance.users.length} users and ${dbInstance.attendance.length} attendance rows from TiDB Cloud.`);
        return { engine: 'tidb', message: 'Connected to TiDB Cloud and loaded active dataset.' };
      } else {
        // TiDB tables empty, legacy dummy data, removed users, or multiple admins: purge and re-sync
        console.log('[Database] ☁️ Purging and synchronizing TiDB Cloud with 16 users (adminbrx@gmail.com exclusive admin)...');
        await clearAllTiDBTables();
        dbInstance = generateInitialSeed();
        saveDbLocalOnly(dbInstance);
        await syncAllToTiDB(dbInstance);
        console.log('[Database] ✅ TiDB Cloud synchronized with 16 users and 1 exclusive admin.');
        return { engine: 'tidb', message: 'Connected to TiDB Cloud and seeded exclusive admin dataset.' };
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

export function normalizeIsoDateTime(val?: string | null): string | null {
  if (!val) return null;
  let s = String(val).trim();
  if (!s.includes('T') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  } else if (s.includes('T') && !s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s = s + 'Z';
  }
  return s;
}

export function enrichAttendance(rec: AttendanceRecord): AttendanceRecord {
  const db = getDb();
  const user = db.users.find((u) => u.id === rec.user_id);
  const dept = user?.department_id ? db.departments.find((d) => d.id === user.department_id) : undefined;

  const normalizedCheckIn = normalizeIsoDateTime(rec.check_in);
  const normalizedCheckOut = normalizeIsoDateTime(rec.check_out);

  let totalMinutes = Number(rec.total_minutes) || 0;
  // If active session (checked in, not checked out yet), compute live duration up to current moment
  if (normalizedCheckIn && !normalizedCheckOut) {
    const startMs = new Date(normalizedCheckIn).getTime();
    if (!isNaN(startMs)) {
      totalMinutes = Math.max(0, Math.floor((Date.now() - startMs) / (1000 * 60)));
    }
  }

  return {
    ...rec,
    check_in: normalizedCheckIn || rec.check_in,
    check_out: normalizedCheckOut || rec.check_out,
    total_minutes: totalMinutes,
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
