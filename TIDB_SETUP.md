# BUILDREX — TiDB Cloud Database Integration Guide

Welcome to the **BUILDREX Smart Attendance & Work Management System** database architecture guide. This document outlines how BUILDREX utilizes **TiDB Cloud** (Distributed Cloud MySQL) for high-availability, ACID-compliant workforce management.

---

## 1. Architecture Overview

BUILDREX uses a **resilient hybrid-engine architecture**:

```
 ┌────────────────────────────────────────────────────────┐
 │            BUILDREX Web Application (React + Vite)     │
 └───────────────────────────┬────────────────────────────┘
                             │ REST / JSON (JWT Cookie)
 ┌───────────────────────────▼────────────────────────────┐
 │               Node.js Express API Server               │
 ├────────────────────────────────────────────────────────┤
 │   Auth · Attendance · Work Updates · AI Intelligence   │
 └─────────────┬────────────────────────────┬─────────────┘
               │ (Primary Engine)           │ (Offline Fallback)
 ┌─────────────▼───────────────┐ ┌──────────▼─────────────┐
 │       TiDB Cloud            │ │   Local Atomic Store   │
 │   Distributed MySQL (HTAP)  │ │     (buildrex.json)    │
 │   - Port 4000 (TLS/SSL)     │ │   - Zero-config local  │
 │   - 10 Relational Tables    │ │   - Instant bootstrap  │
 │   - High Concurrency ACID   │ │   - Auto-migrates up   │
 └─────────────────────────────┘ └────────────────────────┘
```

1. **TiDB Cloud (Distributed SQL)**: When credentials are configured in `.env`, BUILDREX connects via `mysql2/promise` over TLS, creates/verifies all 10 tables, and streams all mutations (check-ins, check-outs, work reports, approvals, audit logs) to TiDB Cloud.
2. **Local Fallback Engine**: If TiDB credentials are not yet configured or if the cluster is unreachable, BUILDREX boots with its local JSON datastore so the application **never crashes or blocks developers**.
3. **Dual Write & Live Sync**: Any local records can be synced to TiDB Cloud in a single click or CLI command.

---

## 2. Relational Schema (10 Tables)

All tables are defined in [`database/schema.sql`](file:///c:/Users/acer/Downloads/buildrex-—-smart-attendance-&-work-management-system/database/schema.sql) and auto-migrated by [`server/tidb.ts`](file:///c:/Users/acer/Downloads/buildrex-—-smart-attendance-&-work-management-system/server/tidb.ts):

| Table Name | Description | Key Columns |
|:---|:---|:---|
| `departments` | Organizational verticals | `id`, `name`, `code`, `manager_id` |
| `users` | Admins, Employees, and Interns | `id`, `employee_code`, `email`, `role`, `department_id` |
| `attendance` | Biometric clock-in/out records | `id`, `user_id`, `work_date`, `check_in`, `check_out`, `status` |
| `work_updates` | Daily work reports & AI feedback | `id`, `user_id`, `work_date`, `tasks_completed`, `status` |
| `leave_requests` | Paid/Sick/Casual leave workflows | `id`, `user_id`, `leave_type`, `start_date`, `end_date`, `status` |
| `attendance_corrections` | Missed clock-in correction tickets | `id`, `user_id`, `requested_check_in`, `requested_check_out` |
| `notifications` | System alerts & submission alerts | `id`, `user_id`, `title`, `message`, `read_at` |
| `audit_logs` | Immutable audit trail & security | `id`, `actor_id`, `action`, `entity_type`, `details` |
| `company_settings` | Shifts, start/end time, grace period | `id`, `work_start_time`, `work_end_time`, `grace_period_minutes` |
| `holidays` | Company recognized paid holidays | `id`, `name`, `date`, `description` |

---

## 3. Quick Setup: Connect TiDB Cloud in 3 Minutes

### Step 1: Create a Free TiDB Cloud Cluster
1. Navigate to **[https://tidbcloud.com](https://tidbcloud.com)** and sign up (Google/GitHub supported).
2. Select **Serverless Tier** (100% Free Forever, includes 25 GiB storage and 50 million Request Units/month).
3. Choose your preferred region (e.g., `AWS US East (N. Virginia)`).
4. Click **Create Cluster**.

### Step 2: Get Connection Credentials
1. In your cluster dashboard, click **Connect**.
2. Select connection method **General** / **MySQL Client**.
3. Generate a root password and note down:
   - **Host** (e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`)
   - **Port** (e.g., `4000`)
   - **User** (e.g., `3x7qxxxxxx.root`)
   - **Password** (e.g., `your_cluster_password`)
   - **Database** (default: `buildrex` or create via `CREATE DATABASE buildrex;`)

### Step 3: Configure `.env`
Open [`.env`](file:///c:/Users/acer/Downloads/buildrex-—-smart-attendance-&-work-management-system/.env) and uncomment/fill in your credentials:

```ini
PORT=3000
JWT_SECRET=buildrex-super-secure-enterprise-jwt-key-2026

# TiDB Cloud Configuration
TIDB_HOST="gateway01.us-east-1.prod.aws.tidbcloud.com"
TIDB_PORT=4000
TIDB_USER="your_cluster_prefix.root"
TIDB_PASSWORD="your_tidb_password"
TIDB_DATABASE="buildrex"
TIDB_SSL=true
```

---

## 4. CLI Commands

BUILDREX includes ready-to-run database automation scripts in `package.json`:

```bash
# Test connection and round-trip latency to TiDB Cloud
npm run db:test

# Run schema migrations (creates all 10 tables if they don't exist)
npm run db:migrate

# Synchronize all local users, attendance, and work updates to TiDB Cloud
npm run db:sync

# One-step complete setup (Migrates tables + Syncs default dataset)
npm run db:setup
```

---

## 5. Web Admin Panel Integration

Admins can inspect and manage the TiDB Cloud database directly from the browser:

1. Log into BUILDREX as Admin (**Alex Vance** — `admin@buildrex.com` / `Buildrex@2026`).
2. Go to **Settings** in the left sidebar.
3. Scroll to the **TiDB Cloud Database Engine** section:
   - **Live Status Indicator**: Shows whether TiDB Cloud is online, version, and latency in milliseconds.
   - **Diagnostic Metrics**: Shows Cluster Host, Port 4000, and TLS encryption status.
   - **Table Row Counters**: Live counts for Users, Attendance, Work Updates, Departments, etc.
   - **Action Buttons**:
     - `Test Connection`: Verifies cluster connectivity without restarting the app.
     - `Run Table Migrations`: Executes DDL queries to create or update tables.
     - `Sync Data to TiDB Cloud`: Backs up and synchronizes all records to TiDB Cloud.
