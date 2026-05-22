-- Facility Management System - Database Schema
-- PostgreSQL Schema Initialization
-- Created: 2026-05-22

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- USERS AND ROLES
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  INDEX idx_users_email (email),
  INDEX idx_users_role_id (role_id)
);

-- ============================================
-- TICKETS
-- ============================================

-- Ticket statuses
CREATE TABLE IF NOT EXISTS ticket_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status_id INTEGER NOT NULL REFERENCES ticket_statuses(id),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  reporter_id UUID NOT NULL REFERENCES users(id),
  assigned_to_id UUID REFERENCES users(id),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  INDEX idx_tickets_status (status_id),
  INDEX idx_tickets_assigned (assigned_to_id),
  INDEX idx_tickets_created (created_at)
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comments_ticket (ticket_id)
);

-- ============================================
-- TASKS
-- ============================================

-- Task statuses
CREATE TABLE IF NOT EXISTS task_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status_id INTEGER NOT NULL REFERENCES task_statuses(id),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_by_id UUID NOT NULL REFERENCES users(id),
  location VARCHAR(255),
  scheduled_date DATE,
  scheduled_time TIME,
  due_date DATE,
  completion_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_status (status_id),
  INDEX idx_tasks_due_date (due_date),
  INDEX idx_tasks_created (created_at)
);

-- Task assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_assignments_task (task_id),
  INDEX idx_assignments_user (assigned_to_id)
);

-- ============================================
-- ATTENDANCE
-- ============================================

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  attendance_date DATE NOT NULL,
  duration_minutes INTEGER,
  location VARCHAR(255),
  check_in_method VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attendance_date),
  INDEX idx_attendance_user (user_id),
  INDEX idx_attendance_date (attendance_date)
);

-- ============================================
-- ALERTS & NOTIFICATIONS
-- ============================================

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  alert_type VARCHAR(50) CHECK (alert_type IN ('task_delayed', 'task_missed', 'ticket_escalated', 'late_attendance', 'threshold', 'system')),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID NOT NULL REFERENCES users(id),
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  INDEX idx_alerts_user (user_id),
  INDEX idx_alerts_read (is_read)
);

-- ============================================
-- MEDIA & UPLOADS
-- ============================================

-- Media files
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id UUID,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_uploaded_by (uploaded_by_id),
  INDEX idx_media_entity (entity_type, entity_id)
);

-- ============================================
-- INITIALIZE DEFAULT DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Full system access and control'),
('FACILITY_MANAGER', 'Manage tasks, tickets, and team'),
('STAFF', 'Basic staff operations')
ON CONFLICT (name) DO NOTHING;

-- Insert ticket statuses
INSERT INTO ticket_statuses (name, description, color) VALUES
('open', 'New issue ticket', '#FF6B6B'),
('in_progress', 'Currently being worked on', '#4ECDC4'),
('completed', 'Issue resolved', '#45B7D1'),
('escalated', 'Escalated for urgent attention', '#FFA07A')
ON CONFLICT (name) DO NOTHING;

-- Insert task statuses
INSERT INTO task_statuses (name, description) VALUES
('pending', 'Waiting to be started'),
('in_progress', 'Currently being worked on'),
('completed', 'Task completed'),
('overdue', 'Past due date')
ON CONFLICT (name) DO NOTHING;

-- Create default admin user (password will be set during initialization)
-- This is a placeholder - actual password will be hashed and set via backend
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
SELECT 'admin@fms.com', '$2a$10$YourHashedPasswordHere', 'Sachin', 'Admin', id, TRUE
FROM roles WHERE name = 'SUPER_ADMIN'
ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- Add timestamps triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fms_user;
