import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb, logAudit, isTiDBConnected } from '../db';
import { syncAllToTiDB } from '../tidb';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth';
import { User, Department } from '../types';
import { TEAM_PASSWORDS } from '../sheetSeedData';

const router = Router();

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1aBE1-g5k-uYmBzTynBFsS5VxxwYDyGXnUV0lW6bqMZ0/gviz/tq?tqx=out:csv&gid=35659883';

let lastSyncTime: string | null = null;
let lastSyncResult: any = null;

/**
 * Robust CSV parser handling quotes and commas
 */
function parseCsv(text: string): string[][] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine.trimEnd());
      currentLine = '';
    } else if (char === '\r') {
      // skip carriage return
    } else {
      currentLine += char;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.trimEnd());
  }

  return lines.map((line) => {
    const cells: string[] = [];
    let cell = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  });
}

function cleanStr(val: any): string {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').trim();
}

/**
 * Generate password for member:
 * First check deterministic TEAM_PASSWORDS map;
 * Otherwise generate `<CleanFirstName>@Brx26`
 */
export function getMemberPassword(email: string, name: string): string {
  const normEmail = email.toLowerCase().trim();
  if (TEAM_PASSWORDS[normEmail]) {
    return TEAM_PASSWORDS[normEmail];
  }
  const firstWord = (name || '').trim().split(/[\s._-]+/)[0] || '';
  const cleanFirst = firstWord.replace(/[^a-zA-Z]/g, '');
  const cap = cleanFirst.length > 0 ? cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1).toLowerCase() : 'Team';
  return `${cap}@Brx26`;
}

/**
 * Map department string to internal ID
 */
function mapDepartment(deptStr: string, titleStr: string, email?: string): { deptId: string; role: 'admin' | 'employee' | 'intern' } {
  const d = (deptStr || '').toLowerCase();
  const t = (titleStr || '').toLowerCase();
  const e = (email || '').toLowerCase().trim();

  // Role detection: ONLY adminbrx@gmail.com is permitted to have the admin role
  let role: 'admin' | 'employee' | 'intern' = 'employee';
  if (e === 'adminbrx@gmail.com') {
    role = 'admin';
  } else if (t.includes('intern') || t.includes('associate')) {
    role = 'intern';
  } else {
    role = 'employee';
  }

  // Department detection
  let deptId = 'dept-eng';
  if (d.includes('finance') || t.includes('cfo') || t.includes('finance')) {
    deptId = 'dept-fin';
  } else if (d.includes('operating') || d.includes('operations') || t.includes('coo') || t.includes('operation')) {
    deptId = 'dept-ops';
  } else if (d.includes('tech') || d.includes('aiml') || d.includes('ai') || d.includes('cse') || d.includes('full stack')) {
    deptId = 'dept-tech';
  } else if (d.includes('media') || t.includes('video') || t.includes('graphic')) {
    deptId = 'dept-media';
  } else if (d.includes('hackathon') || d.includes('event')) {
    deptId = 'dept-events';
  } else if (d.includes('human') || d.includes('hr')) {
    deptId = 'dept-hr';
  }

  return { deptId, role };
}

/**
 * Core synchronization function
 */
export async function performGoogleSheetSync(): Promise<{
  success: boolean;
  totalMembers: number;
  addedCount: number;
  updatedCount: number;
  timestamp: string;
  members: any[];
  error?: string;
}> {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!res.ok) {
      throw new Error(`Google Sheet fetch failed: HTTP ${res.status} ${res.statusText}`);
    }

    const csvText = await res.text();
    const rows = parseCsv(csvText);

    if (rows.length < 2) {
      throw new Error('Google Sheet returned empty or invalid CSV data');
    }

    const header = rows[0].map((h) => cleanStr(h).toLowerCase());
    const emailIdx = header.findIndex((h) => h.includes('email'));
    const nameIdx = header.findIndex((h) => h.includes('name'));
    const phoneIdx = header.findIndex((h) => h.includes('contact') || h.includes('phone'));
    const deptIdx = header.findIndex((h) => h.includes('department'));
    const titleIdx = header.findIndex((h) => h.includes('title') || h.includes('role') || h.includes('intern'));
    const dojIdx = header.findIndex((h) => h.includes('joining'));
    const addrIdx = header.findIndex((h) => h.includes('address'));
    const dobIdx = header.findIndex((h) => h.includes('birth'));
    const bioIdx = header.findIndex((h) => h.includes('bio'));

    const db = getDb();
    let addedCount = 0;
    let updatedCount = 0;
    const syncedMemberList: any[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const email = cleanStr(row[emailIdx >= 0 ? emailIdx : 3]).toLowerCase();
      const rawName = cleanStr(row[nameIdx >= 0 ? nameIdx : 1]);
      if (!email || !rawName) continue;

      // Exclude permanently removed persons
      const EXCLUDED_EMAILS = [
        'layeequeahmed602@gmail.com',
        'nmuhammadshees11@gmail.com',
        'syedmdaakif007@gmail.com',
        'sajidahmedrs10@gmail.com',
        'muzammilaamirmuzzu@gmail.com',
        'vmohammedsaad@gmail.com',
        'mohammedaffan1506@gmail.com',
      ];
      if (EXCLUDED_EMAILS.includes(email)) continue;

      const phone = cleanStr(row[phoneIdx >= 0 ? phoneIdx : 2]);
      const deptRaw = cleanStr(row[deptIdx >= 0 ? deptIdx : 5]);
      const titleRaw = cleanStr(row[titleIdx >= 0 ? titleIdx : 6]);
      const dojRaw = cleanStr(row[dojIdx >= 0 ? dojIdx : 7]);
      const address = cleanStr(row[addrIdx >= 0 ? addrIdx : 8]);

      const { deptId, role } = mapDepartment(deptRaw, titleRaw, email);
      const plainPassword = getMemberPassword(email, rawName);

      // Parse joining date YYYY-MM-DD
      let joiningDate = '2026-06-01';
      if (dojRaw) {
        const parts = dojRaw.split('/');
        if (parts.length === 3) {
          const m = parts[0].padStart(2, '0');
          const d = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          joiningDate = `${y}-${m}-${d}`;
        }
      }

      // Check if user exists
      const existingUser = db.users.find((u) => u.email.toLowerCase() === email);

      if (existingUser) {
        // Update user profile fields if changed
        existingUser.name = rawName;
        existingUser.phone = phone || existingUser.phone;
        existingUser.position = titleRaw || existingUser.position;
        existingUser.department_id = deptId || existingUser.department_id;
        existingUser.updated_at = nowIso;
        updatedCount++;

        syncedMemberList.push({
          id: existingUser.id,
          employee_code: existingUser.employee_code,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          position: existingUser.position,
          department_id: existingUser.department_id,
          phone: existingUser.phone,
          plainPassword,
          status: existingUser.status,
          isNew: false,
        });
      } else {
        // Create new team member
        const nextCodeNum = db.users.length + 1;
        const codePrefix = role === 'intern' ? 'BRX-INT-' : role === 'admin' ? 'BRX-ADM-' : 'BRX-EMP-';
        const employee_code = `${codePrefix}${String(nextCodeNum).padStart(2, '0')}`;

        const newUser: User = {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          employee_code,
          name: rawName,
          email,
          password_hash: bcrypt.hashSync(plainPassword, 10),
          role,
          department_id: deptId,
          manager_id: 'user-emad',
          position: titleRaw || (role === 'intern' ? 'Intern' : 'Team Member'),
          phone: phone || '',
          joining_date: joiningDate,
          status: 'active',
          created_at: nowIso,
          updated_at: nowIso,
        };

        db.users.push(newUser);
        addedCount++;

        syncedMemberList.push({
          id: newUser.id,
          employee_code: newUser.employee_code,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          position: newUser.position,
          department_id: newUser.department_id,
          phone: newUser.phone,
          plainPassword,
          status: newUser.status,
          isNew: true,
        });
      }
    }

    // Save changes locally and sync to TiDB Cloud
    await saveDb(db);

    lastSyncTime = new Date().toISOString();
    lastSyncResult = {
      success: true,
      totalMembers: syncedMemberList.length,
      addedCount,
      updatedCount,
      timestamp: lastSyncTime,
      members: syncedMemberList,
    };

    logAudit(
      { id: 'system', name: 'Google Sheet Live Sync' },
      'GOOGLE_SHEET_LIVE_SYNC',
      'system',
      'google-sheet-live',
      {
        totalMembers: syncedMemberList.length,
        addedCount,
        updatedCount,
        tidbSynced: isTiDBConnected(),
      }
    );

    return lastSyncResult;
  } catch (err: any) {
    console.error('[GoogleSheetSync] Error syncing from Google Sheet:', err.message);
    return {
      success: false,
      totalMembers: 0,
      addedCount: 0,
      updatedCount: 0,
      timestamp: new Date().toISOString(),
      members: [],
      error: err.message,
    };
  }
}

// GET /api/sync/google-sheet-status
router.get('/google-sheet-status', (req: Request, res: Response): void => {
  const db = getDb();
  res.json({
    success: true,
    lastSyncTime,
    activeTeamCount: db.users.filter((u) => u.status === 'active').length,
    tiDbConnected: isTiDBConnected(),
    sheetUrl: GOOGLE_SHEET_CSV_URL,
    lastResult: lastSyncResult
      ? {
          totalMembers: lastSyncResult.totalMembers,
          addedCount: lastSyncResult.addedCount,
          updatedCount: lastSyncResult.updatedCount,
          timestamp: lastSyncResult.timestamp,
        }
      : null,
  });
});

// POST /api/sync/google-sheet (Live sync trigger)
router.post('/google-sheet', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await performGoogleSheetSync();
  if (result.success) {
    res.json({
      success: true,
      message: `Successfully synchronized ${result.totalMembers} team members from Google Sheet. (${result.addedCount} added, ${result.updatedCount} refreshed)`,
      data: result,
    });
  } else {
    res.status(500).json({
      success: false,
      message: `Failed to synchronize Google Sheet: ${result.error}`,
      error: result.error,
    });
  }
});

// GET /api/sync/team-credentials (Admin/Quick reference of all team passwords)
router.get('/team-credentials', (req: Request, res: Response): void => {
  const db = getDb();
  const credentials = db.users.map((u) => {
    const plainPassword = getMemberPassword(u.email, u.name);
    const dept = db.departments.find((d) => d.id === u.department_id);
    return {
      id: u.id,
      employee_code: u.employee_code,
      name: u.name,
      email: u.email,
      role: u.role,
      position: u.position,
      department: dept ? dept.name : 'Engineering & Technology',
      phone: u.phone,
      joining_date: u.joining_date,
      status: u.status,
      password: plainPassword,
    };
  });

  res.json({
    success: true,
    total: credentials.length,
    lastSyncTime,
    credentials,
  });
});

export default router;
