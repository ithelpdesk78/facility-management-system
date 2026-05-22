// Dashboard Routes
// Dashboard summary and analytics

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get open tickets count
    const ticketsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tickets 
       WHERE status_id IN (SELECT id FROM ticket_statuses WHERE name IN ('open', 'in_progress'))
       AND (assigned_to_id = $1 OR reporter_id = $1)`,
      [userId]
    );

    // Get pending tasks count
    const tasksResult = await pool.query(
      `SELECT COUNT(*) as count FROM task_assignments 
       WHERE assigned_to_id = $1 AND status IN ('pending', 'in_progress')`,
      [userId]
    );

    // Get today's attendance
    const attendanceResult = await pool.query(
      `SELECT check_in_time, check_out_time FROM attendance 
       WHERE user_id = $1 AND attendance_date = CURRENT_DATE`,
      [userId]
    );

    // Get alerts count
    const alertsResult = await pool.query(
      `SELECT COUNT(*) as count FROM alerts 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        openTickets: parseInt(ticketsResult.rows[0].count),
        pendingTasks: parseInt(tasksResult.rows[0].count),
        unreadAlerts: parseInt(alertsResult.rows[0].count),
        todayAttendance: attendanceResult.rows.length > 0 ? {
          checkedIn: attendanceResult.rows[0].check_in_time !== null,
          checkedOut: attendanceResult.rows[0].check_out_time !== null
        } : { checkedIn: false, checkedOut: false }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get analytics (Admin/Manager only)
router.get('/analytics', async (req, res) => {
  try {
    // Task completion rate
    const tasksAnalytics = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
       FROM tasks`
    );

    // Ticket statistics
    const ticketsAnalytics = await pool.query(
      `SELECT status_id, ts.name, COUNT(*) as count
       FROM tickets t
       JOIN ticket_statuses ts ON t.status_id = ts.id
       GROUP BY status_id, ts.name`
    );

    // Staff performance
    const staffPerformance = await pool.query(
      `SELECT 
        u.id, 
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(ta.id) as total_assignments
       FROM users u
       LEFT JOIN task_assignments ta ON u.id = ta.assigned_to_id
       WHERE u.role_id IN (SELECT id FROM roles WHERE name = 'STAFF')
       GROUP BY u.id, u.first_name, u.last_name`
    );

    res.json({
      success: true,
      data: {
        taskCompletion: {
          total: parseInt(tasksAnalytics.rows[0].total),
          completed: parseInt(tasksAnalytics.rows[0].completed),
          percentage: Math.round((parseInt(tasksAnalytics.rows[0].completed) / parseInt(tasksAnalytics.rows[0].total)) * 100)
        },
        ticketStats: ticketsAnalytics.rows,
        staffPerformance: staffPerformance.rows
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
