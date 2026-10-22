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
  'admin@buildrex.com': 'BRX@Admin2026',
  'layeequeahmed602@gmail.com': 'Layeeque@Brx26',
  'ehsaanehsaan61@gmail.com': 'Ehsaan@Brx26',
  'faisalzafeera@gmail.com': 'Zafeera@Brx26',
  'nmuhammadshees11@gmail.com': 'Shees@Brx26',
  'sujiimmi@gmail.com': 'Immanuel@Brx26',
  'syedmdaakif007@gmail.com': 'Aakif@Brx26',
  'sajidahmedrs10@gmail.com': 'Sajid@Brx26',
  'Hafizfareedvlr@gmail.com': 'Fareed@Brx26',
  'jmuhammadameen19@gmail.com': 'Ameen@Brx26',
  'affafmaleeha@gmail.com': 'Maleeha@Brx26',
  'muzammilaamirmuzzu@gmail.com': 'Muzammil@Brx26',
  'mohammedaffan1506@gmail.com': 'Affan@Brx26',
  'vmohammedsaad@gmail.com': 'Saad@Brx26',
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
      manager_id: 'user-aakif',
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
      manager_id: 'user-layeeque',
      created_at: nowIso,
    },
    {
      id: 'dept-media',
      name: 'Media & Communications',
      code: 'MEDIA',
      description: 'Social media management, video editing, graphic design, and brand communications',
      manager_id: 'user-affan',
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
      manager_id: 'user-muzammil',
      created_at: nowIso,
    },
  ];
}

// ────────────────────────────────────────────────
// USERS — All 22 real team members + 1 system admin
// ────────────────────────────────────────────────
function buildUsers(nowIso: string): User[] {
  return [
    // ──── SYSTEM ADMIN ────
    {
      id: 'user-admin-master',
      employee_code: 'BRX-ADM-00',
      name: 'Buildrex Admin',
      email: 'admin@buildrex.com',
      password_hash: hashPw(TEAM_PASSWORDS['admin@buildrex.com']),
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
    // ──── C-SUITE / ADMIN ROLES ────
    {
      id: 'user-layeeque',
      employee_code: 'BRX-CFO-01',
      name: 'Layeeque Ahmed.S',
      email: 'layeequeahmed602@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['layeequeahmed602@gmail.com']),
      role: 'admin',
      department_id: 'dept-fin',
      manager_id: null,
      position: 'CFO & Hackathon Organizer',
      phone: '9025815073',
      joining_date: '2026-06-19',
      status: 'active',
      created_at: '2026-08-11T10:19:48Z',
      updated_at: nowIso,
    },
    {
      id: 'user-ehsaan',
      employee_code: 'BRX-COO-02',
      name: 'G Mohamed Ehsaan',
      email: 'ehsaanehsaan61@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['ehsaanehsaan61@gmail.com']),
      role: 'admin',
      department_id: 'dept-ops',
      manager_id: null,
      position: 'Chief Operating Officer',
      phone: '9894484534',
      joining_date: '2026-07-23',
      status: 'active',
      created_at: '2026-08-11T12:49:05Z',
      updated_at: nowIso,
    },
    {
      id: 'user-aakif',
      employee_code: 'BRX-CTO-03',
      name: 'S Mohammed Aakif',
      email: 'syedmdaakif007@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['syedmdaakif007@gmail.com']),
      role: 'admin',
      department_id: 'dept-tech',
      manager_id: null,
      position: 'Chief Technology Officer',
      phone: '9790562321',
      joining_date: '2026-06-02',
      status: 'active',
      created_at: '2026-08-15T11:55:34Z',
      updated_at: nowIso,
    },
    {
      id: 'user-emad',
      employee_code: 'BRX-CTO-04',
      name: 'Mohamed Emad Ur Rahman',
      email: 'emadurrahmank2008@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['emadurrahmank2008@gmail.com']),
      role: 'admin',
      department_id: 'dept-tech',
      manager_id: 'user-aakif',
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
      id: 'user-sajid',
      employee_code: 'BRX-EMP-06',
      name: 'Sajid Ahmed R S',
      email: 'sajidahmedrs10@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['sajidahmedrs10@gmail.com']),
      role: 'employee',
      department_id: 'dept-tech',
      manager_id: 'user-aakif',
      position: 'Team Lead',
      phone: '8610463660',
      joining_date: '2026-06-25',
      status: 'active',
      created_at: '2026-08-15T07:53:11Z',
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
      manager_id: 'user-aakif',
      position: 'Team Leader',
      phone: '8778477488',
      joining_date: '2026-07-31',
      status: 'active',
      created_at: '2026-08-15T07:52:35Z',
      updated_at: nowIso,
    },
    {
      id: 'user-saad',
      employee_code: 'BRX-EMP-08',
      name: 'Mohammed Saad V',
      email: 'vmohammedsaad@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['vmohammedsaad@gmail.com']),
      role: 'employee',
      department_id: 'dept-tech',
      manager_id: 'user-aakif',
      position: 'Startup Team Lead',
      phone: '8643033733',
      joining_date: '2026-05-20',
      status: 'active',
      created_at: '2026-08-18T12:07:13Z',
      updated_at: nowIso,
    },
    {
      id: 'user-affan',
      employee_code: 'BRX-EMP-09',
      name: 'Mohammed Affan C',
      email: 'mohammedaffan1506@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['mohammedaffan1506@gmail.com']),
      role: 'employee',
      department_id: 'dept-media',
      manager_id: 'user-ehsaan',
      position: 'Social Media Manager',
      phone: '8122355616',
      joining_date: '2026-06-19',
      status: 'active',
      created_at: '2026-08-19T21:52:09Z',
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
      manager_id: 'user-layeeque',
      position: 'Hackathon Department Team Lead',
      phone: '8754678240',
      joining_date: '2026-09-07',
      status: 'active',
      created_at: '2026-09-07T21:27:07Z',
      updated_at: nowIso,
    },
    {
      id: 'user-muzammil',
      employee_code: 'BRX-EMP-11',
      name: 'Muzammil Aamir',
      email: 'muzammilaamirmuzzu@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['muzammilaamirmuzzu@gmail.com']),
      role: 'employee',
      department_id: 'dept-amb',
      manager_id: 'user-ehsaan',
      position: 'Campus Ambassadors Manager',
      phone: '8248524447',
      joining_date: '2026-06-12',
      status: 'active',
      created_at: '2026-08-15T15:15:02Z',
      updated_at: nowIso,
    },
    // ──── INTERNS ────
    {
      id: 'user-shees',
      employee_code: 'BRX-INT-12',
      name: 'N Muhammad Shees',
      email: 'nmuhammadshees11@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['nmuhammadshees11@gmail.com']),
      role: 'intern',
      department_id: 'dept-hack',
      manager_id: 'user-layeeque',
      position: 'Competition Coordinator',
      phone: '6369673667',
      joining_date: '2026-06-14',
      status: 'active',
      created_at: '2026-08-13T09:50:01Z',
      updated_at: nowIso,
    },
    {
      id: 'user-immanuel',
      employee_code: 'BRX-INT-13',
      name: 'R.Immanuel',
      email: 'sujiimmi@gmail.com',
      password_hash: hashPw(TEAM_PASSWORDS['sujiimmi@gmail.com']),
      role: 'intern',
      department_id: 'dept-tech',
      manager_id: 'user-aakif',
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
      manager_id: 'user-affan',
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
      manager_id: 'user-aakif',
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
      manager_id: 'user-affan',
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
      manager_id: 'user-aakif',
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
      manager_id: 'user-affan',
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
      manager_id: 'user-layeeque',
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
        reviewed_by: d > 3 ? 'user-layeeque' : null,
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
  const today = getTodayDateString();

  const departments = buildDepartments(nowIso);
  const users = buildUsers(nowIso);
  const attendance = buildAttendance(users, today, nowIso);
  const work_updates = buildWorkUpdates(users, nowIso);

  const leave_requests: LeaveRequest[] = [
    {
      id: 'leave-1',
      user_id: 'user-maleeha',
      leave_type: 'sick',
      start_date: '2026-10-22',
      end_date: '2026-10-23',
      days_count: 2,
      reason: 'Medical appointment and recovery',
      status: 'pending',
      reviewed_by: null,
      review_comment: null,
      reviewed_at: null,
      created_at: nowIso,
    },
    {
      id: 'leave-2',
      user_id: 'user-sahil',
      leave_type: 'casual',
      start_date: '2026-10-25',
      end_date: '2026-10-26',
      days_count: 2,
      reason: 'Family function',
      status: 'approved',
      reviewed_by: 'user-layeeque',
      review_comment: 'Approved. Please ensure hackathon tasks are delegated.',
      reviewed_at: nowIso,
      created_at: nowIso,
    },
    {
      id: 'leave-3',
      user_id: 'user-abbas',
      leave_type: 'casual',
      start_date: '2026-10-28',
      end_date: '2026-10-28',
      days_count: 1,
      reason: 'Personal work in hometown',
      status: 'pending',
      reviewed_by: null,
      review_comment: null,
      reviewed_at: null,
      created_at: nowIso,
    },
  ];

  const attendance_corrections: AttendanceCorrection[] = [
    {
      id: 'corr-1',
      user_id: 'user-ameen',
      attendance_id: 'att-user-ameen-sample',
      work_date: '2026-10-15',
      requested_check_in: '2026-10-15T08:58:00Z',
      requested_check_out: '2026-10-15T18:10:00Z',
      reason: 'Forgot to check out — was in a media editing session until late',
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
      user_id: 'user-layeeque',
      title: 'New Leave Request',
      message: 'Maleeha Affaf (BRX-INT-15) submitted a Sick Leave request for Oct 22-23.',
      type: 'info',
      read_at: null,
      link: '/admin/leave-requests',
      created_at: nowIso,
    },
    {
      id: 'notif-2',
      user_id: 'user-ehsaan',
      title: 'Attendance Correction Pending',
      message: 'Muhammad Ameen J (BRX-INT-14) requested an attendance correction for Oct 15.',
      type: 'warning',
      read_at: null,
      link: '/admin/leave-requests',
      created_at: nowIso,
    },
    {
      id: 'notif-3',
      user_id: 'user-abbas',
      title: 'Welcome to BUILDREX Portal',
      message: 'Your attendance & work management profile is active. Submit your daily report by 6:00 PM.',
      type: 'info',
      read_at: null,
      link: '/dashboard',
      created_at: nowIso,
    },
    {
      id: 'notif-4',
      user_id: 'user-aakif',
      title: 'New Leave Request',
      message: 'Mohammed Abbas R Y (BRX-INT-18) submitted a Casual Leave request for Oct 28.',
      type: 'info',
      read_at: null,
      link: '/admin/leave-requests',
      created_at: nowIso,
    },
  ];

  const audit_logs: AuditLogItem[] = [
    {
      id: 'audit-1',
      actor_id: 'user-admin-master',
      actor_name: 'Buildrex Admin',
      action: 'SYSTEM_INITIALIZATION',
      entity_type: 'SYSTEM',
      entity_id: 'BUILDREX-SYSTEM',
      details: { version: '2.0.0', initialized_tables: 10, total_users: users.length },
      ip_address: '127.0.0.1',
      created_at: nowIso,
    },
    {
      id: 'audit-2',
      actor_id: 'user-layeeque',
      actor_name: 'Layeeque Ahmed.S',
      action: 'APPROVE_LEAVE',
      entity_type: 'LEAVE_REQUEST',
      entity_id: 'leave-2',
      details: { user: 'Sahil', days: 2, type: 'casual' },
      ip_address: '127.0.0.1',
      created_at: nowIso,
    },
  ];

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
