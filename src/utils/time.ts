/**
 * Unified Time, Date, and Attendance Duration Utilities
 * Handles timezone normalization between MySQL DATETIME and ISO 8601 UTC strings.
 */

export function parseAttendanceDate(val?: string | null): Date | null {
  if (!val) return null;
  let s = String(val).trim();

  // If format is YYYY-MM-DD HH:mm:ss (MySQL / TiDB DATETIME), standardize to UTC ISO
  if (!s.includes('T') && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  } else if (s.includes('T') && !s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s = s + 'Z';
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns formatted 12-hour clock time (e.g. "07:46 PM" or "--:--")
 */
export function formatClockTime(val?: string | null): string {
  if (!val) return '--:--';
  const d = parseAttendanceDate(val);
  if (!d) return '--:--';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculates live seconds elapsed from check-in to now (or total seconds if checked out)
 */
export function getElapsedSeconds(checkIn?: string | null, checkOut?: string | null, storedMinutes?: number): number {
  if (checkOut) {
    if (typeof storedMinutes === 'number' && storedMinutes > 0) {
      return storedMinutes * 60;
    }
    const start = parseAttendanceDate(checkIn);
    const end = parseAttendanceDate(checkOut);
    if (start && end) {
      return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    }
    return 0;
  }

  if (!checkIn) return 0;
  const start = parseAttendanceDate(checkIn);
  if (!start) return 0;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
}

/**
 * Formats a running live session timer as HH:MM:SS (e.g. "01:01:34")
 */
export function formatLiveTimer(checkIn?: string | null, checkOut?: string | null, storedMinutes?: number): string {
  const totalSec = getElapsedSeconds(checkIn, checkOut, storedMinutes);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formats working duration as human-friendly string (e.g. "1.0 hrs" or "1h 01m")
 */
export function formatWorkingDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const decimalHours = (safeMinutes / 60).toFixed(1);
  return `${decimalHours} hrs`;
}

/**
 * Detailed hours + minutes format: "1h 02m (1.0 hrs)"
 */
export function formatWorkingDurationDetailed(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  const decimalHours = (safeMinutes / 60).toFixed(1);

  if (h === 0) {
    return `${m}m (${decimalHours} hrs)`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m (${decimalHours} hrs)`;
}
