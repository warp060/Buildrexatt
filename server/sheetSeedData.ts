/**
 * BUILDREX — Real-World Seed Data
 * Source: Official BUILDREX Google Sheet (22 team members)
 * Each member has a unique, secure password derived from their name.
 */
import bcrypt from 'bcryptjs';
import type {
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

// ────────────────────────────────────────────────
// PASSWORD MAP — Unique password per team member
// ────────────────────────────────────────────────
export const TEAM_PASSWORDS: Record<string, string> = {
  'adminbrx@gmail.com': 'buidrex@123',
  'ehsaanehsaan61@gmail.com': 'Ehsaan@Brx26',
  'faisalzafeera@gmail.com': 'Zafeera@Brx26',
  'sujiimmi@gmail.com': 'Immanuel@Brx26',
  'Hafizfareedvlr@gmail.com': 'Fareed@Brx26',
  'jmuhammadameen19@gmail.com': 'Ameen@Brx26',
  'affafmaleeha@gmail.com': 'Maleeha@Brx26',
  'ayshaanam.k3706@gmail.com': 'Aysha@Brx26',
  'ashfaqashu689@gmail.com': 'Ashfaq@Brx26',
  'sahilsyed612@gmail.com': 'Sahil@Brx26',
  'abbas6618532@gmail.com': 'Abbas@Brx26',
  'mushrathtaj0407@gmail.com': 'Mushrath@Brx26',
  'sumaiyajameelahamed@gmail.com': 'Sumaiya@Brx26',
  'azeezmohammed560@gmail.com': 'Azeez@Brx26',
  'afrafameena1208@gmail.com': 'Afra@Brx26',
  'emadurrahmank2008@gmail.com': 'Emad@Brx26',
};

function hashPw(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────
// DEPARTMENTS — mapped from Google Sheet departments
// ────────────────────────────────────────────────
function buildDepartments(nowIso: string): Department[] {
  return [
    {
      id: 'dept-tech',
      name: 'Technology & Engineering',
      code: 'TECH',
      description: 'Full-stack development, cloud infrastructure, AI/ML systems, and CTO office',
      manager_id: 'user-emad',
      created_at: nowIso,
    },
    {
      id: 'dept-ops',
      name: 'Operations & Management',
      code: 'OPS',
      description: 'Chief Operating Officer office, operations management, and strategic execution',
      manager_id: 'user-ehsaan',
      created_at: nowIso,
    },
    {
      id: 'dept-fin',
      name: 'Finance & Administration',
      code: 'FIN',
      description: 'Financial planning, budgeting, accounts, and administrative coordination',
      manager_id: 'user-ehsaan',
      created_at: nowIso,
    },
    {
      id: 'dept-media',
      name: 'Media & Communications',
      code: 'MEDIA',
      description: 'Social media management, video editing, graphic design, and brand communications',
      manager_id: 'user-ehsaan',
      created_at: nowIso,
    },
    {
      id: 'dept-hack',
      name: 'Hackathons & Events',
      code: 'HACK',
      description: 'Hackathon organization, event coordination, competitions, and campus outreach',
      manager_id: 'user-sahil',
      created_at: nowIso,
    },
    {
      id: 'dept-hr',
      name: 'Human Resources',
      code: 'HR',
      description: 'Talent acquisition, people ops, and employee experience',
      manager_id: 'user-sumaiya',
      created_at: nowIso,
    },
    {
      id: 'dept-amb',
      name: 'Campus Ambassadors',
      code: 'AMB',
      description: 'Campus ambassador program, university relations, and brand advocacy',
      manager_id: 'user-ehsaan',
      created_at: nowIso,
    },
  ];
}

// ────────────────────────────────────────────────
// USERS — All 22 real team members + 1 system admin
// ────────────────────────────────────────────────
function buildUsers(nowIso: string): User[] {
  return [
    // ──── SYSTEM ADMIN (EXCLUSIVE ADMIN ACCESS) ────
    {
      id: 'user-admin-master',
      employee_code: 'BRX-ADM-00',
      name: 'Buildrex Admin',
      email: 'adminbrx@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['adminbrx@gmail.com']),
      role: 'admin',
      department_id: 'dept-ops',
      manager_id: null,
      position: 'System Administrator',
      phone: '9894484534',
      joining_date: '2026-05-01',
      status: 'active',
      created_at: '2026-05-01T09:00:00Z',
      updated_at: nowIso,
    },
    // ──── EXECUTIVE LEADERSHIP (EMPLOYEE ROLE) ────
    {
      id: 'user-ehsaan',
      employee_code: 'BRX-COO-02',
      name: 'G Mohamed Ehsaan',
      email: 'ehsaanehsaan61@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['ehsaanehsaan61@gmail.com']),
      role: 'employee',
      department_id: 'dept-ops',
      manager_id: 'user-admin-master',
      position: 'Chief Operating Officer',
      phone: '9894484534',
      joining_date: '2026-07-23',
      status: 'active',
      created_at: '2026-08-11T12:49:05Z',
      updated_at: nowIso,
    },
    {
      id: 'user-emad',
      employee_code: 'BRX-CTO-04',
      name: 'Mohamed Emad Ur Rahman',
      email: 'emadurrahmank2008@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['emadurrahmank2008@gmail.com']),
      role: 'employee',
      department_id: 'dept-tech',
      manager_id: 'user-admin-master',
      position: 'CTO',
      phone: '6380559119',
      joining_date: '2026-09-23',
      status: 'active',
      created_at: '2026-09-27T13:00:10Z',
      updated_at: nowIso,
    },
    // ──── EMPLOYEES ────
    {
      id: 'user-zafeera',
      employee_code: 'BRX-EMP-05',
      name: 'Zafeera',
      email: 'faisalzafeera@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['faisalzafeera@gmail.com']),
      role: 'employee',
      department_id: 'dept-ops',
      manager_id: 'user-ehsaan',
      position: 'Operations Manager',
      phone: '8300879846',
      joining_date: '2026-07-08',
      status: 'active',
      created_at: '2026-08-11T18:18:29Z',
      updated_at: nowIso,
    },
    {
      id: 'user-fareed',
      employee_code: 'BRX-EMP-07',
      name: 'N Fareeduddeen',
      email: 'Hafizfareedvlr@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['Hafizfareedvlr@gmail.com']),
      role: 'employee',
      department_id: 'dept-tech',
      manager_id: 'user-emad',
      position: 'Team Leader',
      phone: '8778477488',
      joining_date: '2026-07-31',
      status: 'active',
      created_at: '2026-08-15T07:52:35Z',
      updated_at: nowIso,
    },
    {
      id: 'user-sahil',
      employee_code: 'BRX-EMP-10',
      name: 'Sahil',
      email: 'sahilsyed612@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['sahilsyed612@gmail.com']),
      role: 'employee',
      department_id: 'dept-hack',
      manager_id: 'user-ehsaan',
      position: 'Hackathon Department Team Lead',
      phone: '8754678240',
      joining_date: '2026-09-07',
      status: 'active',
      created_at: '2026-09-07T21:27:07Z',
      updated_at: nowIso,
    },
    // ──── INTERNS ────
    {
      id: 'user-immanuel',
      employee_code: 'BRX-INT-13',
      name: 'R.Immanuel',
      email: 'sujiimmi@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['sujiimmi@gmail.com']),
      role: 'intern',
      department_id: 'dept-tech',
      manager_id: 'user-emad',
      position: 'Tech Intern',
      phone: '',
      joining_date: '2026-08-04',
      status: 'active',
      created_at: '2026-08-14T21:53:02Z',
      updated_at: nowIso,
    },
    {
      id: 'user-ameen',
      employee_code: 'BRX-INT-14',
      name: 'Muhammad Ameen J',
      email: 'jmuhammadameen19@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['jmuhammadameen19@gmail.com']),
      role: 'intern',
      department_id: 'dept-media',
      manager_id: 'user-ehsaan',
      position: 'Assistant Department Head (Media)',
      phone: '9600801085',
      joining_date: '2026-07-31',
      status: 'active',
      created_at: '2026-08-15T07:45:12Z',
      updated_at: nowIso,
    },
    {
      id: 'user-maleeha',
      employee_code: 'BRX-INT-15',
      name: 'Maleeha Affaf',
      email: 'affafmaleeha@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['affafmaleeha@gmail.com']),
      role: 'intern',
      department_id: 'dept-tech',
      manager_id: 'user-emad',
      position: 'App Developer',
      phone: '9487646507',
      joining_date: '2026-07-01',
      status: 'active',
      created_at: '2026-08-15T19:52:06Z',
      updated_at: nowIso,
    },
    {
      id: 'user-aysha',
      employee_code: 'BRX-INT-16',
      name: 'Aysha Anam K',
      email: 'ayshaanam.k3706@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['ayshaanam.k3706@gmail.com']),
      role: 'intern',
      department_id: 'dept-hack',
      manager_id: 'user-sahil',
      position: 'Video Editor',
      phone: '7339072724',
      joining_date: '2026-06-14',
      status: 'active',
      created_at: '2026-08-19T23:00:16Z',
      updated_at: nowIso,
    },
    {
      id: 'user-ashfaq',
      employee_code: 'BRX-INT-17',
      name: 'Ashfaq Ahmed.M',
      email: 'ashfaqashu689@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['ashfaqashu689@gmail.com']),
      role: 'intern',
      department_id: 'dept-media',
      manager_id: 'user-ehsaan',
      position: 'Video Editor',
      phone: '8122677955',
      joining_date: '2026-05-11',
      status: 'active',
      created_at: '2026-08-19T23:30:10Z',
      updated_at: nowIso,
    },
    {
      id: 'user-abbas',
      employee_code: 'BRX-INT-18',
      name: 'Mohammed Abbas R Y',
      email: 'abbas6618532@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['abbas6618532@gmail.com']),
      role: 'intern',
      department_id: 'dept-tech',
      manager_id: 'user-emad',
      position: 'Full Stack Intern',
      phone: '6369906810',
      joining_date: '2026-09-06',
      status: 'active',
      created_at: '2026-09-07T21:31:06Z',
      updated_at: nowIso,
    },
    {
      id: 'user-mushrath',
      employee_code: 'BRX-INT-19',
      name: 'M.Mushrath Taj',
      email: 'mushrathtaj0407@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['mushrathtaj0407@gmail.com']),
      role: 'intern',
      department_id: 'dept-hack',
      manager_id: 'user-sahil',
      position: 'Hackathon Operations & Coordination Intern',
      phone: '9791439076',
      joining_date: '2026-10-02',
      status: 'active',
      created_at: '2026-10-01T09:43:50Z',
      updated_at: nowIso,
    },
    {
      id: 'user-sumaiya',
      employee_code: 'BRX-INT-20',
      name: 'Sumaiya J',
      email: 'sumaiyajameelahamed@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['sumaiyajameelahamed@gmail.com']),
      role: 'intern',
      department_id: 'dept-hr',
      manager_id: 'user-ehsaan',
      position: 'HR Intern',
      phone: '9025920732',
      joining_date: '2026-09-22',
      status: 'active',
      created_at: '2026-09-22T15:11:30Z',
      updated_at: nowIso,
    },
    {
      id: 'user-azeez',
      employee_code: 'BRX-INT-21',
      name: 'Mohammad Azeez.N',
      email: 'azeezmohammed560@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['azeezmohammed560@gmail.com']),
      role: 'intern',
      department_id: 'dept-media',
      manager_id: 'user-ehsaan',
      position: 'Graphic Designer',
      phone: '9171313874',
      joining_date: '2026-09-18',
      status: 'active',
      created_at: '2026-09-21T10:07:22Z',
      updated_at: nowIso,
    },
    {
      id: 'user-afra',
      employee_code: 'BRX-INT-22',
      name: 'A Afra Fameena',
      email: 'afrafameena1208@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['afrafameena1208@gmail.com']),
      role: 'intern',
      department_id: 'dept-fin',
      manager_id: 'user-ehsaan',
      position: 'Finance Intern',
      phone: '9361224059',
      joining_date: '2026-09-28',
      status: 'active',
      created_at: '2026-09-25T21:16:47Z',
      updated_at: nowIso,
    },
  ];
}

// ────────────────────────────────────────────────
// ATTENDANCE GENERATION — realistic past 15 days
// ────────────────────────────────────────────────
function buildAttendance(users: User[], today: string, nowIso: string): AttendanceRecord[] {
  const attendance: AttendanceRecord[] = [];
  const currentDate = new Date();

  // Generate 15 working days of history for all non-admin users
  const activeWorkers = users.filter((u) => u.role !== 'admin' || u.id === 'user-admin-master');

  for (let d = 15; d >= 1; d--) {
    const pastDate = new Date(currentDate);
    pastDate.setDate(pastDate.getDate() - d);
    if (pastDate.getDay() === 0 || pastDate.getDay() === 6) continue;
    const dateStr = pastDate.toISOString().split('T')[0];

    activeWorkers.forEach((u, idx) => {
      // Random: ~20% absent, ~15% late, rest on-time
      const seed = (idx * 7 + d * 13) % 20;
      if (seed === 0) return; // absent day
      const isLate = seed <= 3;
      const hours = 8 + (seed % 3);
      const inMinute = isLate ? 20 + (seed % 15) : (seed % 12);
      const inHour = `09:${String(inMinute).padStart(2, '0')}:00`;
      const outHour = `17:${String(30 + (seed % 25)).padStart(2, '0')}:00`;
      const totalMinutes = isLate ? 460 + (seed * 5) : 490 + (seed * 3);

      attendance.push({
        id: `att-${u.id}-${dateStr}`,
        user_id: u.id,
        work_date: dateStr,
        check_in: `${dateStr}T${inHour}Z`,
        check_out: `${dateStr}T${outHour}Z`,
        total_minutes: totalMinutes,
        status: isLate ? 'late' : 'present',
        notes: isLate ? 'Arrived after grace period' : 'Normal shift completed',
        created_at: `${dateStr}T${inHour}Z`,
        updated_at: `${dateStr}T${outHour}Z`,
      });
    });
  }

  // Note: Today starts empty. Only users who actually log in and click Punch In will have attendance for today.
  return attendance;
}

// ────────────────────────────────────────────────
// WORK UPDATES — realistic past submissions
// ────────────────────────────────────────────────
function buildWorkUpdates(users: User[], nowIso: string): WorkUpdate[] {
  const updates: WorkUpdate[] = [];
  const currentDate = new Date();
  const taskSamples = [
    'Implemented responsive UI components for the dashboard module',
    'Conducted code review for sprint #14 pull requests',
    'Designed and deployed the hackathon registration flow',
    'Updated social media content calendar and scheduled posts',
    'Configured CI/CD pipeline for staging environment',
    'Reviewed and onboarded 3 new campus ambassadors',
    'Prepared quarterly financial report and budget analysis',
    'Built API endpoints for attendance tracking module',
    'Created video content for upcoming hackathon promotion',
    'Fixed critical bug in user authentication flow',
    'Developed mobile-responsive layouts for event pages',
    'Organized team standup and sprint planning session',
  ];

  const projectSamples = [
    'BUILDREX Core Platform',
    'Hackathon Portal v2.0',
    'Campus Outreach Campaign',
    'Social Media Automation',
    'Finance Dashboard',
    'HR Onboarding System',
    'Ambassador Management Portal',
  ];

  const workers = users.filter((u) => u.role !== 'admin' || u.id === 'user-admin-master');

  for (let d = 12; d >= 1; d--) {
    const pastDate = new Date(currentDate);
    pastDate.setDate(pastDate.getDate() - d);
    if (pastDate.getDay() === 0 || pastDate.getDay() === 6) continue;
    const dateStr = pastDate.toISOString().split('T')[0];

    workers.forEach((u, idx) => {
      const seed = (idx * 5 + d * 11) % 15;
      if (seed === 0) return; // didn't submit that day
      const taskIdx = (idx + d) % taskSamples.length;
      const projIdx = (idx + d) % projectSamples.length;

      updates.push({
        id: `wu-${u.id}-${dateStr}`,
        user_id: u.id,
        work_date: dateStr,
        tasks_completed: `- ${taskSamples[taskIdx]}\n- ${taskSamples[(taskIdx + 1) % taskSamples.length]}\n- Attended team sync meeting`,
        project_details: projectSamples[projIdx],
        accomplishments: 'Completed all planned deliverables on schedule',
        blockers: seed % 5 === 0 ? 'Waiting on design assets from external vendor' : 'None',
        next_day_plan: `Continue with ${projectSamples[(projIdx + 1) % projectSamples.length]} tasks`,
        hours_spent: 7 + (seed % 3),
        status: d > 3 ? 'reviewed' : 'submitted',
        submitted_at: `${dateStr}T17:30:00Z`,
        reviewed_by: d > 3 ? 'user-ehsaan' : null,
        review_comment: d > 3 ? 'Good progress. Keep up the momentum.' : null,
        reviewed_at: d > 3 ? `${dateStr}T18:15:00Z` : null,
        created_at: `${dateStr}T17:30:00Z`,
        updated_at: `${dateStr}T18:15:00Z`,
      });
    });
  }

  return updates;
}

// ────────────────────────────────────────────────
// GENERATE COMPLETE DATABASE
// ────────────────────────────────────────────────
export function generateSeedDatabase() {
  const nowIso = new Date().toISOString();

  const departments = buildDepartments(nowIso);
  const users = buildUsers(nowIso);
  const attendance: AttendanceRecord[] = [
    {
      id: 'att-1793282100000-azeez',
      user_id: 'user-azeez',
      work_date: '2026-10-29',
      check_in: '2026-10-29T13:45:00.000Z',
      check_out: '2026-10-29T13:59:00.000Z',
      total_minutes: 14,
      status: 'late',
      notes: 'Late arrival (checked in after grace window)',
      ip_address: '127.0.0.1',
      created_at: '2026-10-29T13:45:00.000Z',
      updated_at: '2026-10-29T13:59:00.000Z',
    },
    {
      id: 'att-1793282100000-abbas',
      user_id: 'user-abbas',
      work_date: '2026-10-29',
      check_in: '2026-10-29T13:45:00.000Z',
      check_out: '2026-10-29T13:59:00.000Z',
      total_minutes: 14,
      status: 'late',
      notes: 'Late arrival (checked in after grace window)',
      ip_address: '127.0.0.1',
      created_at: '2026-10-29T13:45:00.000Z',
      updated_at: '2026-10-29T13:59:00.000Z',
    },
  ];
  const work_updates: WorkUpdate[] = [];
  const leave_requests: LeaveRequest[] = [];
  const attendance_corrections: AttendanceCorrection[] = [];
  const notifications: NotificationItem[] = [];
  const audit_logs: AuditLogItem[] = [];

  const company_settings: CompanySettings = {
    id: 1,
    company_name: 'BUILDREX Technologies',
    work_start_time: '09:00',
    work_end_time: '18:00',
    grace_period_minutes: 15,
    half_day_minutes: 240,
    full_day_minutes: 480,
    timezone: 'Asia/Kolkata',
    allow_breaks: true,
    updated_at: nowIso,
  };

  const holidays: Holiday[] = [
    {
      id: 'hol-1',
      name: 'Gandhi Jayanti',
      date: '2026-10-02',
      description: 'National Holiday — Mahatma Gandhi Birthday',
      created_at: nowIso,
    },
    {
      id: 'hol-2',
      name: 'BUILDREX Annual Summit Day',
      date: '2026-10-30',
      description: 'Annual corporate innovation retreat & hackathon showcase',
      created_at: nowIso,
    },
    {
      id: 'hol-3',
      name: 'Diwali',
      date: '2026-11-08',
      description: 'Festival of Lights — Company Holiday',
      created_at: nowIso,
    },
    {
      id: 'hol-4',
      name: 'Republic Day',
      date: '2027-01-26',
      description: 'National Holiday',
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
