// Report Routes
// Generate reports and analytics

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Task completion report
router.get('/tasks', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        t.id,
        t.title,
        ts.name as status,
        COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_assignments,
        COUNT(ta.id) as total_assignments,
        t.created_at,
        t.due_date
      FROM tasks t
      JOIN task_statuses ts ON t.status_id = ts.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND t.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY t.id, t.title, ts.name, t.created_at, t.due_date ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Task report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate task report'
    });
  }
});

// Ticket statistics report
router.get('/tickets', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        ts.name as status,
        COUNT(*) as count,
        COUNT(CASE WHEN t.priority = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_count
      FROM tickets t
      JOIN ticket_statuses ts ON t.status_id = ts.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND t.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY ts.name`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Ticket report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ticket report'
    });
  }
});

// Staff performance report
router.get('/staff', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(ta.id) as total_tasks,
        ROUND(100.0 * COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) / 
              NULLIF(COUNT(ta.id), 0), 2) as completion_rate,
        COUNT(DISTINCT a.attendance_date) as days_present,
        ROUND(AVG(a.duration_minutes)/60, 2) as avg_hours_per_day
      FROM users u
      LEFT JOIN task_assignments ta ON u.id = ta.assigned_to_id
      LEFT JOIN attendance a ON u.id = a.user_id
      WHERE u.role_id IN (SELECT id FROM roles WHERE name = 'STAFF')
    `;
    const params = [];

    if (startDate) {
      query += ` AND ta.completed_at >= $${params.length + 1} AND a.attendance_date >= $${params.length + 1}`;
      params.push(startDate, startDate);
    }

    if (endDate) {
      query += ` AND ta.completed_at <= $${params.length + 1} AND a.attendance_date <= $${params.length + 1}`;
      params.push(endDate, endDate);
    }

    query += ` GROUP BY u.id, u.first_name, u.last_name, u.email ORDER BY completed_tasks DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Staff report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate staff report'
    });
  }
});

// Attendance report
router.get('/attendance', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COUNT(*) as total_days,
        COUNT(CASE WHEN a.check_in_time IS NOT NULL THEN 1 END) as present_days,
        COUNT(CASE WHEN a.check_in_time IS NULL THEN 1 END) as absent_days,
        ROUND(AVG(a.duration_minutes)/60, 2) as avg_hours
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id
      WHERE u.role_id IN (SELECT id FROM roles WHERE name = 'STAFF')
    `;
    const params = [];

    if (startDate) {
      query += ` AND a.attendance_date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND a.attendance_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    if (userId) {
      query += ` AND u.id = $${params.length + 1}`;
      params.push(userId);
    }

    query += ` GROUP BY u.id, u.first_name, u.last_name ORDER BY present_days DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report'
    });
  }
});

module.exports = router;
