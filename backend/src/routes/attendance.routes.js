// Attendance Routes
// Check-in, check-out, and attendance tracking

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Check in
router.post('/checkin', async (req, res) => {
  try {
    const { location, method = 'manual' } = req.body;
    const userId = req.user.id;

    // Check if already checked in today
    const existingResult = await pool.query(
      `SELECT id FROM attendance 
       WHERE user_id = $1 AND attendance_date = CURRENT_DATE AND check_in_time IS NOT NULL`,
      [userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const attendanceId = uuidv4();
    await pool.query(
      `INSERT INTO attendance (id, user_id, attendance_date, check_in_time, location, check_in_method)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_TIMESTAMP, $3, $4)`,
      [attendanceId, userId, location, method]
    );

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: { id: attendanceId }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in'
    });
  }
});

// Check out
router.post('/checkout', async (req, res) => {
  try {
    const { location } = req.body;
    const userId = req.user.id;

    // Get today's attendance
    const result = await pool.query(
      `SELECT id, check_in_time FROM attendance 
       WHERE user_id = $1 AND attendance_date = CURRENT_DATE`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No check-in found for today'
      });
    }

    // Calculate duration
    const checkInTime = new Date(result.rows[0].check_in_time);
    const checkOutTime = new Date();
    const durationMinutes = Math.round((checkOutTime - checkInTime) / 60000);

    await pool.query(
      `UPDATE attendance 
       SET check_out_time = CURRENT_TIMESTAMP, duration_minutes = $1
       WHERE id = $2`,
      [durationMinutes, result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: { durationMinutes }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out'
    });
  }
});

// Get today's attendance
router.get('/today', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 AND attendance_date = CURRENT_DATE`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance'
    });
  }
});

// Get attendance report (Admin/Manager)
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let query = `
      SELECT a.*, u.first_name, u.last_name, u.email
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
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
      query += ` AND a.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    query += ` ORDER BY a.attendance_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance report'
    });
  }
});

// Get user's attendance history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 30, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1
       ORDER BY attendance_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history'
    });
  }
});

module.exports = router;
