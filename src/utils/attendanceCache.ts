import { AttendanceRecord } from '../types';

export interface TodayAttendanceState {
  record: AttendanceRecord | null;
  status_summary: 'Not Started' | 'Checked In' | 'Checked Out';
}

const CACHE_KEY = 'buildrex_today_attendance_cache';

export function getTodayDateKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

export function getCachedTodayAttendance(userId?: string): TodayAttendanceState {
  if (typeof window === 'undefined') {
    return { record: null, status_summary: 'Not Started' };
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { record: null, status_summary: 'Not Started' };
    const parsed = JSON.parse(raw);
    const today = getTodayDateKey();
    if (parsed && parsed.work_date === today && (!userId || parsed.user_id === userId)) {
      return {
        record: parsed.record || null,
        status_summary: parsed.status_summary || 'Not Started',
      };
    }
  } catch {
    // fallback
  }
  return { record: null, status_summary: 'Not Started' };
}

export function setCachedTodayAttendance(
  userId: string | undefined,
  state: TodayAttendanceState
): void {
  if (typeof window === 'undefined') return;
  try {
    const today = getTodayDateKey();
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        work_date: today,
        user_id: userId,
        record: state.record,
        status_summary: state.status_summary,
        saved_at: Date.now(),
      })
    );
  } catch {
    // ignore storage quota / access errors
  }
}
