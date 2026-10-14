-- ====================================================================
-- BUILDREX — Smart Attendance & Work Management System
-- Normalized MySQL Database Schema (v1.0.0)
-- Target: MySQL 8.0+ / MariaDB 10.5+
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS attendance_corrections;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS work_updates;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS company_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departments Table
CREATE TABLE departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    manager_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table (Admins, Employees, Interns)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee', 'intern') NOT NULL DEFAULT 'employee',
    department_id VARCHAR(36),
    manager_id VARCHAR(36),
    position VARCHAR(100),
    phone VARCHAR(30),
    joining_date DATE NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update departments foreign key for manager_id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Attendance Table
CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    work_date DATE NOT NULL,
    check_in DATETIME NOT NULL,
    check_out DATETIME NULL,
    total_minutes INT UNSIGNED DEFAULT 0,
    status ENUM('present', 'late', 'half_day', 'absent', 'incomplete') NOT NULL DEFAULT 'present',
    ip_address VARCHAR(45),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_work_date UNIQUE (user_id, work_date),
    CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_attendance_date (work_date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Daily Work Updates Table
CREATE TABLE work_updates (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    work_date DATE NOT NULL,
    tasks_completed TEXT NOT NULL,
    project_details VARCHAR(255) NOT NULL,
    accomplishments TEXT,
    blockers TEXT,
    next_day_plan TEXT,
    hours_spent DECIMAL(4,1) DEFAULT 8.0,
    status ENUM('draft', 'submitted', 'reviewed', 'needs_revision') NOT NULL DEFAULT 'submitted',
    submitted_at DATETIME NULL,
    reviewed_by VARCHAR(36) NULL,
    review_comment TEXT,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_work_update_user_date UNIQUE (user_id, work_date),
    CONSTRAINT fk_work_update_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_update_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_work_updates_status (status),
    INDEX idx_work_updates_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Leave Requests Table
CREATE TABLE leave_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    leave_type ENUM('casual', 'sick', 'paid', 'unpaid', 'emergency') NOT NULL DEFAULT 'casual',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT UNSIGNED NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(36) NULL,
    review_comment TEXT,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leave_status (status),
    INDEX idx_leave_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Attendance Correction Requests Table
CREATE TABLE attendance_corrections (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    attendance_id VARCHAR(36) NOT NULL,
    requested_check_in DATETIME NOT NULL,
    requested_check_out DATETIME NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(36) NULL,
    review_comment TEXT,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_correction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_correction_attendance FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
    CONSTRAINT fk_correction_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_correction_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'alert') NOT NULL DEFAULT 'info',
    read_at DATETIME NULL,
    link VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Audit Logs Table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36) NULL,
    actor_name VARCHAR(120) NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(60) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_actor (actor_id),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Company Settings & Rules Table
CREATE TABLE company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(120) NOT NULL DEFAULT 'BUILDREX Technologies Inc.',
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    work_end_time TIME NOT NULL DEFAULT '18:00:00',
    grace_period_minutes INT UNSIGNED NOT NULL DEFAULT 15,
    half_day_minutes INT UNSIGNED NOT NULL DEFAULT 240,
    full_day_minutes INT UNSIGNED NOT NULL DEFAULT 480,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
    allow_breaks BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Holidays Table
CREATE TABLE holidays (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    date DATE NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
