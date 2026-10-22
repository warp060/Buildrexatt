import {
  User,
  AttendanceRecord,
  WorkUpdate,
  LeaveRequest,
  AttendanceCorrection,
  NotificationItem,
  AuditLogItem,
  CompanySettings,
  Department,
  DashboardStats,
  AiStatus,
  PolishedReportResult,
  ExecutiveDigestResult,
  SupervisorFeedbackResult,
  DatabaseStatus,
} from './types';

// Helper for fetch with credentials and error handling
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('buildrex_jwt');
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ success: boolean; user: User; company_settings: CompanySettings }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, new_password: string) =>
    request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, new_password }),
    }),

  updateProfile: (data: { name?: string; phone?: string }) =>
    request<{ success: boolean; user: User; message: string }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Attendance
  checkIn: () =>
    request<{ success: boolean; message: string; attendance: AttendanceRecord }>('/api/attendance/check-in', {
      method: 'POST',
    }),

  checkOut: () =>
    request<{ success: boolean; message: string; attendance: AttendanceRecord }>('/api/attendance/check-out', {
      method: 'POST',
    }),

  getTodayAttendance: () =>
    request<{
      success: boolean;
      work_date: string;
      record: AttendanceRecord | null;
      current_duration_minutes: number;
      status_summary: 'Not Started' | 'Checked In' | 'Checked Out';
    }>('/api/attendance/today'),

  getAttendanceHistory: (params: { start_date?: string; end_date?: string; status?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{
      success: boolean;
      total: number;
      page: number;
      page_size: number;
      summary: {
        total_days_logged: number;
        total_hours_worked: number;
        average_hours_per_day: number;
        late_arrivals_count: number;
        half_days_count: number;
      };
      records: AttendanceRecord[];
    }>(`/api/attendance/history?${query}`);
  },

  getAdminAttendance: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{
      success: boolean;
      total: number;
      page: number;
      page_size: number;
      records: AttendanceRecord[];
    }>(`/api/admin/attendance?${query}`);
  },

  updateAdminAttendance: (id: string, data: Partial<AttendanceRecord>) =>
    request<{ success: boolean; message: string; record: AttendanceRecord }>(`/api/admin/attendance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Work Updates
  saveWorkUpdate: (data: {
    work_date?: string;
    tasks_completed: string;
    project_details: string;
    accomplishments?: string;
    blockers?: string;
    next_day_plan?: string;
    hours_spent?: number;
    status: 'draft' | 'submitted';
  }) =>
    request<{ success: boolean; message: string; work_update: WorkUpdate }>('/api/work-updates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyWorkUpdates: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; total: number; page: number; records: WorkUpdate[] }>(
      `/api/work-updates/my?${query}`
    );
  },

  getTodayWorkUpdate: () =>
    request<{ success: boolean; work_date: string; record: WorkUpdate | null; is_submitted: boolean }>(
      '/api/work-updates/today'
    ),

  getAdminWorkUpdates: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; page: number; records: WorkUpdate[] }>(
      `/api/work-updates/admin/list?${query}`
    );
  },

  reviewWorkUpdate: (id: string, data: { status: 'reviewed' | 'needs_revision'; review_comment?: string }) =>
    request<{ success: boolean; message: string; record: WorkUpdate }>(`/api/work-updates/admin/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Leave Requests
  getMyLeaveRequests: () =>
    request<{ success: boolean; records: LeaveRequest[] }>('/api/leave-requests/my'),

  submitLeaveRequest: (data: { leave_type: string; start_date: string; end_date: string; reason: string }) =>
    request<{ success: boolean; message: string; record: LeaveRequest }>('/api/leave-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAdminLeaveRequests: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; total: number; page: number; records: LeaveRequest[] }>(
      `/api/leave-requests/admin/list?${query}`
    );
  },

  reviewLeaveRequest: (id: string, data: { status: 'approved' | 'rejected'; review_comment?: string }) =>
    request<{ success: boolean; message: string; record: LeaveRequest }>(
      `/api/leave-requests/admin/${id}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  // Attendance Corrections
  getMyCorrections: () =>
    request<{ success: boolean; records: AttendanceCorrection[] }>('/api/attendance/correction-requests/my'),

  submitCorrectionRequest: (data: {
    attendance_id?: string;
    work_date: string;
    requested_check_in: string;
    requested_check_out: string;
    reason: string;
  }) =>
    request<{ success: boolean; message: string; record: AttendanceCorrection }>(
      '/api/attendance/correction-requests',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getAdminCorrections: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; total: number; page: number; records: AttendanceCorrection[] }>(
      `/api/admin/attendance-corrections?${query}`
    );
  },

  reviewCorrectionRequest: (id: string, data: { status: 'approved' | 'rejected'; review_comment?: string }) =>
    request<{ success: boolean; message: string; record: AttendanceCorrection }>(
      `/api/admin/attendance-corrections/${id}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  // Admin Dashboard & Reports
  getDashboardStats: () =>
    request<{
      success: boolean;
      stats: DashboardStats;
      recent_attendance: AttendanceRecord[];
      today_attendance: AttendanceRecord[];
      unpunched_today: User[];
      department_stats: Array<{ id: string; name: string; code: string; total_members: number; present_today: number; rate: number }>;
      trend_days: Array<{ date: string; present: number; late: number; rate: number }>;
    }>('/api/admin/dashboard-stats'),

  getAdminUsers: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; users: User[] }>(`/api/admin/users?${query}`);
  },

  createUser: (data: any) =>
    request<{ success: boolean; message: string; user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: any) =>
    request<{ success: boolean; message: string; user: User }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminResetUserPassword: (id: string, new_password?: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    }),

  getAttendanceReport: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{
      success: boolean;
      summary: {
        total_sessions: number;
        total_hours: number;
        average_session_hours: number;
        late_arrivals: number;
        half_days: number;
      };
      records: AttendanceRecord[];
    }>(`/api/admin/reports/attendance?${query}`);
  },

  getWorkUpdatesReport: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{
      success: boolean;
      summary: {
        total_updates: number;
        reviewed: number;
        needs_revision: number;
        pending_review: number;
      };
      records: WorkUpdate[];
    }>(`/api/admin/reports/work-updates?${query}`);
  },

  getDepartments: () =>
    request<{ success: boolean; departments: Department[] }>('/api/departments'),

  createDepartment: (data: Partial<Department>) =>
    request<{ success: boolean; department: Department }>('/api/admin/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCompanySettings: (data: Partial<CompanySettings>) =>
    request<{ success: boolean; message: string; settings: CompanySettings }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAuditLogs: (params: { page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; total: number; page: number; logs: AuditLogItem[] }>(
      `/api/admin/audit-logs?${query}`
    );
  },

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; notifications: NotificationItem[] }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  // Gemini AI Intelligence Suite
  getAiStatus: () =>
    request<{ success: boolean; status: AiStatus }>('/api/ai/status'),

  setGeminiApiKey: (apiKey: string) =>
    request<{ success: boolean; message: string; status: AiStatus }>('/api/ai/set-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),

  polishWorkReport: (data: {
    project_details: string;
    tasks_completed: string;
    accomplishments?: string;
    blockers?: string;
    next_day_plan?: string;
  }) =>
    request<{ success: boolean; data: PolishedReportResult }>('/api/ai/polish-report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExecutiveDigest: (date?: string) =>
    request<{ success: boolean; digest: ExecutiveDigestResult }>('/api/ai/executive-digest', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  getSupervisorFeedback: (data: { report_id?: string; report?: Partial<WorkUpdate> }) =>
    request<{ success: boolean; feedback: SupervisorFeedbackResult }>('/api/ai/supervisor-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Database Administration & TiDB Cloud
  getDatabaseStatus: () =>
    request<{ success: boolean; database: DatabaseStatus }>('/api/admin/database/status'),

  testDatabaseConnection: (data?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
  }) =>
    request<{ success: boolean; message: string; version?: string; latencyMs?: number }>(
      '/api/admin/database/test',
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }
    ),

  syncDatabase: () =>
    request<{ success: boolean; message: string }>('/api/admin/database/sync', {
      method: 'POST',
    }),

  runDatabaseMigration: () =>
    request<{ success: boolean; message: string }>('/api/admin/database/migrate', {
      method: 'POST',
    }),

  // Google Sheet Real-time Sync & Credentials
  getGoogleSheetStatus: () =>
    request<{
      success: boolean;
      lastSyncTime: string | null;
      activeTeamCount: number;
      tiDbConnected: boolean;
      sheetUrl: string;
      lastResult: any;
    }>('/api/sync/google-sheet-status'),

  syncGoogleSheet: () =>
    request<{
      success: boolean;
      message: string;
      data: {
        totalMembers: number;
        addedCount: number;
        updatedCount: number;
        timestamp: string;
        members: any[];
      };
    }>('/api/sync/google-sheet', { method: 'POST' }),

  getTeamCredentials: () =>
    request<{
      success: boolean;
      total: number;
      lastSyncTime: string | null;
      credentials: Array<{
        id: string;
        employee_code: string;
        name: string;
        email: string;
        role: string;
        position: string;
        department: string;
        phone: string;
        joining_date: string;
        status: string;
        password: string;
      }>;
    }>('/api/sync/team-credentials'),
};
