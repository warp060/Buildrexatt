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
  role: UserRole;
  department_id: string | null;
  department_name?: string;
  manager_id: string | null;
  manager_name?: string;
  position: string;
  phone: string;
  joining_date: string;
  status: UserStatus;
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
  work_date: string;
  check_in: string;
  check_out: string | null;
  total_minutes: number;
  status: AttendanceStatus;
  notes?: string;
  ip_address?: string;
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
  work_date: string;
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
  start_date: string;
  end_date: string;
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
  work_start_time: string;
  work_end_time: string;
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

export interface AiStatus {
  hasApiKey: boolean;
  model: string;
  mode: 'live' | 'simulated';
}

export interface PolishedReportResult {
  tasks_completed: string;
  project_details: string;
  accomplishments: string;
  blockers: string;
  next_day_plan: string;
  summary: string;
  polish_notes: string;
  is_simulated: boolean;
  model: string;
}

export interface BlockerRadarItem {
  id: string;
  severity: 'critical' | 'moderate' | 'low';
  department: string;
  reporter: string;
  role: string;
  blocker: string;
  impact: string;
  action_plan: string;
}

export interface DepartmentMomentum {
  department: string;
  active_members: number;
  total_hours: number;
  key_achievements: string[];
  status: 'on_track' | 'blocked' | 'needs_attention';
}

export interface ExecutiveDigestResult {
  date: string;
  total_reports: number;
  total_hours: number;
  executive_summary: string;
  key_highlights: string[];
  blocker_radar: BlockerRadarItem[];
  department_momentum: DepartmentMomentum[];
  suggested_leadership_actions: string[];
  is_simulated: boolean;
  model: string;
  generated_at: string;
}

export interface SupervisorFeedbackResult {
  suggested_comment: string;
  sentiment: 'positive' | 'constructive' | 'needs_urgent_followup';
  key_deliverables_noted: string[];
  recommended_status: 'reviewed' | 'needs_revision';
  coaching_tip: string;
  is_simulated: boolean;
  model: string;
}

export interface DatabaseStatus {
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

