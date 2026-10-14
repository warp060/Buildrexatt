export type UserRole = 'admin' | 'employee' | 'intern';
export type UserStatus = 'active' | 'inactive';
export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'incomplete';
export type WorkUpdateStatus = 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
export type LeaveType = 'casual' | 'sick' | 'paid' | 'unpaid' | 'emergency';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  employee_code: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  department_id: string | null;
  department_name?: string;
  manager_id: string | null;
  manager_name?: string;
  position: string;
  phone: string;
  joining_date: string;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  manager_id: string | null;
  created_at: string;
  user_count?: number;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name?: string;
  employee_code?: string;
  role?: UserRole;
  department_name?: string;
  work_date: string; // YYYY-MM-DD
  check_in: string; // ISO 8601 UTC
  check_out: string | null; // ISO 8601 UTC
  total_minutes: number;
  status: AttendanceStatus;
  ip_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkUpdate {
  id: string;
  user_id: string;
  user_name?: string;
  employee_code?: string;
  role?: UserRole;
  department_name?: string;
  work_date: string; // YYYY-MM-DD
  tasks_completed: string;
  project_details: string;
  accomplishments: string;
  blockers: string;
  next_day_plan: string;
  hours_spent: number;
  status: WorkUpdateStatus;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewer_name?: string;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name?: string;
  employee_code?: string;
  role?: UserRole;
  department_name?: string;
  leave_type: LeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  days_count: number;
  reason: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewer_name?: string;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AttendanceCorrection {
  id: string;
  user_id: string;
  user_name?: string;
  employee_code?: string;
  role?: UserRole;
  department_name?: string;
  attendance_id: string;
  work_date: string;
  requested_check_in: string;
  requested_check_out: string;
  reason: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewer_name?: string;
  review_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read_at: string | null;
  link?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  work_start_time: string; // HH:MM
  work_end_time: string; // HH:MM
  grace_period_minutes: number;
  half_day_minutes: number;
  full_day_minutes: number;
  timezone: string;
  allow_breaks: boolean;
  updated_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  active_employees: number;
  active_interns: number;
  present_today: number;
  currently_working: number;
  absent_today: number;
  on_leave_today: number;
  incomplete_today: number;
  attendance_rate_percent: number;
  pending_work_updates: number;
  pending_leave_requests: number;
  pending_corrections: number;
}
