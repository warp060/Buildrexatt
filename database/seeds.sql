-- ====================================================================
-- BUILDREX — Initial Demo Seed Script for Production MySQL
-- ====================================================================

-- 1. Departments
INSERT INTO departments (id, name, code, description) VALUES
('dept-eng', 'Software Engineering', 'ENG', 'Core web platforms, distributed cloud services, and client applications'),
('dept-ai', 'AI & Innovation', 'AI-LAB', 'Next-generation intelligent agent systems, automation pipelines, and model evaluation'),
('dept-ux', 'Product & UI/UX', 'PROD', 'User experience design, frontend architecture, and design systems'),
('dept-ops', 'Operations & Growth', 'OPS', 'Operations, people excellence, talent development, and strategic partnerships')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Initial Users (Password: Buildrex@2026 - bcrypt hash below)
-- $2a$10$UoW0835G7F7bF4FjIqWnqubCkvYx0yHhW9oZ5pD7sVl0o8O2QZf8y
INSERT INTO users (id, employee_code, name, email, password_hash, role, department_id, position, phone, joining_date, status) VALUES
('user-admin-1', 'BRX-001', 'Alex Vance', 'admin@buildrex.com', '$2a$10$7zBv44D6wE0o2nS5m3L67.vH7U7yT/pMh0oO1rQ9bQ7L5mK8nI0yO', 'admin', 'dept-ops', 'Chief Operations Officer', '+1 (415) 890-2100', '2023-01-15', 'active'),
('user-emp-1', 'BRX-102', 'Sarah Chen', 'sarah.chen@buildrex.com', '$2a$10$7zBv44D6wE0o2nS5m3L67.vH7U7yT/pMh0oO1rQ9bQ7L5mK8nI0yO', 'employee', 'dept-eng', 'Engineering Lead', '+1 (415) 890-2101', '2023-06-01', 'active'),
('user-emp-2', 'BRX-105', 'Marcus Reed', 'marcus.reed@buildrex.com', '$2a$10$7zBv44D6wE0o2nS5m3L67.vH7U7yT/pMh0oO1rQ9bQ7L5mK8nI0yO', 'employee', 'dept-ux', 'Senior Product Designer', '+1 (415) 890-2102', '2024-02-15', 'active'),
('user-int-1', 'BRX-INT-01', 'Devin Patel', 'intern.dev@buildrex.com', '$2a$10$7zBv44D6wE0o2nS5m3L67.vH7U7yT/pMh0oO1rQ9bQ7L5mK8nI0yO', 'intern', 'dept-eng', 'Frontend Engineering Intern', '+1 (415) 890-2103', '2026-06-01', 'active'),
('user-int-2', 'BRX-INT-02', 'Priya Sharma', 'priya.sharma@buildrex.com', '$2a$10$7zBv44D6wE0o2nS5m3L67.vH7U7yT/pMh0oO1rQ9bQ7L5mK8nI0yO', 'intern', 'dept-ai', 'AI Research Intern', '+1 (415) 890-2104', '2026-06-15', 'active'),
('user-int-3', 'BRX-INT-03', 'Liam Ross', 'liam.ross@buildrex.com', '$2a$10$7zBv44D6wE0o2nS5m3L67.vH7U7yT/pMh0oO1rQ9bQ7L5mK8nI0yO', 'intern', 'dept-ops', 'Business Operations Intern', '+1 (415) 890-2105', '2026-07-01', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Company Settings
INSERT INTO company_settings (id, company_name, work_start_time, work_end_time, grace_period_minutes, half_day_minutes, full_day_minutes, timezone, allow_breaks) VALUES
(1, 'BUILDREX Technologies Inc.', '09:00:00', '18:00:00', 15, 240, 480, 'America/Los_Angeles', TRUE)
ON DUPLICATE KEY UPDATE company_name=VALUES(company_name);
