# BUILDREX — Smart Attendance & Work Management System

BUILDREX is a comprehensive, modern, enterprise-grade attendance and daily work management system tailored for interns, full-time employees, and operations administrators.

---

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express.js REST API with authentication and role-based permissions.
- **Database:** Normalized schema with MySQL production DDL/seed scripts (`database/schema.sql`, `database/seeds.sql`) and an embedded ACID JSON file datastore (`data/buildrex.json`) for zero-configuration, immediate local development.
- **Security:** Bcrypt password hashing, JWT bearer & HTTP-Only cookies, parameterized queries, and system audit logging.

---

## Default Demo Credentials

All accounts come pre-configured with password: `Buildrex@2026`

| Role | Name | Email | Code |
| :--- | :--- | :--- | :--- |
| **Administrator** | Alex Vance (COO) | `admin@buildrex.com` | `BRX-001` |
| **Employee Lead** | Sarah Chen (Eng Lead) | `sarah.chen@buildrex.com` | `BRX-102` |
| **Employee** | Marcus Reed (UI/UX) | `marcus.reed@buildrex.com` | `BRX-105` |
| **Intern** | Devin Patel (Frontend) | `intern.dev@buildrex.com` | `BRX-INT-01` |
| **Intern** | Priya Sharma (AI Lab) | `priya.sharma@buildrex.com` | `BRX-INT-02` |
| **Intern** | Liam Ross (Operations) | `liam.ross@buildrex.com` | `BRX-INT-03` |

*Note: You can also use the one-click demo persona switcher on the login page or in the top navigation bar.*

---

## Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm or bun

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

### 3. Run the Development Server
Start the unified full-stack server (runs Express API on port 3000 with Vite middleware mounted):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## MySQL Production Deployment

To connect the application to a managed MySQL instance (e.g. AWS RDS, Google Cloud SQL, or local MySQL):

1. **Execute Schema Migration:**
   ```bash
   mysql -u <username> -p <database_name> < database/schema.sql
   ```
2. **Execute Initial Demo Seeds (Optional):**
   ```bash
   mysql -u <username> -p <database_name> < database/seeds.sql
   ```
3. **Build Frontend Bundle:**
   ```bash
   npm run build
   ```
4. **Start Production Server:**
   ```bash
   npm start
   ```

---

## REST API Specification

### Authentication
- `POST /api/auth/login` — Sign in with email and password
- `POST /api/auth/logout` — Invalidate session and clear cookies
- `GET /api/auth/me` — Retrieve active authenticated session
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Finalize password update
- `PATCH /api/auth/profile` — Update name or phone number
- `PATCH /api/auth/change-password` — Change password with current password verification

### Biometric Attendance
- `POST /api/attendance/check-in` — Clock in for today's shift (verifies shift rules & grace period)
- `POST /api/attendance/check-out` — Clock out and compute working minutes
- `GET /api/attendance/today` — Retrieve today's status and live duration
- `GET /api/attendance/history` — Fetch user's attendance history and metrics
- `GET /api/admin/attendance` — Admin query with date, role, dept, and status filters
- `PATCH /api/admin/attendance/:id` — Administrator manual timestamp adjustment

### Daily Work Updates
- `POST /api/work-updates` — Draft or submit daily work update
- `GET /api/work-updates/my` — Fetch current user's work updates
- `GET /api/work-updates/today` — Fetch today's work update status
- `GET /api/work-updates/admin/list` — Supervisor review list
- `PATCH /api/work-updates/admin/:id/review` — Mark Reviewed or request revisions with feedback

### Leave & Correction Requests
- `GET /api/leave-requests/my` — Fetch personal leave history
- `POST /api/leave-requests` — Submit time-off application
- `GET /api/leave-requests/admin/list` — Administrator leave approval queue
- `PATCH /api/leave-requests/admin/:id/review` — Approve or reject leave
- `POST /api/attendance/correction-requests` — Request attendance timestamp fix
- `GET /api/admin/attendance-corrections` — Administrator correction queue
- `PATCH /api/admin/attendance-corrections/:id/review` — Approve or reject correction (auto-updates attendance)

### Operations & Auditing
- `GET /api/admin/dashboard-stats` — Enterprise KPI aggregates & 7-day attendance trends
- `GET /api/admin/users` — Employee and intern directory
- `POST /api/admin/users` — Provision new employee/intern account
- `PATCH /api/admin/users/:id` — Update member attributes or deactivate
- `GET /api/admin/reports/attendance` — Exportable attendance ledger
- `GET /api/admin/reports/work-updates` — Exportable daily work updates report
- `GET /api/admin/settings` & `PATCH /api/admin/settings` — Shift hours and grace periods
- `GET /api/admin/audit-logs` — Immutable administrative event trail
