// Alert Routes
// Alerts and notifications management

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Get user alerts
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM alerts 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// Get unread alerts count
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM alerts 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// Mark alert as read
router.put('/:id/read', async (req, res) => {
  try {
    const alertId = req.params.id;

    await pool.query(
      `UPDATE alerts 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [alertId]
    );

    res.json({
      success: true,
      message: 'Alert marked as read'
    });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read'
    });
  }
});

// Mark all alerts as read
router.put('/read/all', async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE alerts 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All alerts marked as read'
    });
  } catch (error) {
    console.error('Mark all alerts read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alerts as read'
    });
  }
});

// Create alert (Admin/System)
router.post('/', async (req, res) => {
  try {
    const { title, message, alertType, severity, userId, relatedEntityType, relatedEntityId } = req.body;

    if (!title || !message || !alertType || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    const alertId = uuidv4();
    await pool.query(
      `INSERT INTO alerts (id, title, message, alert_type, severity, user_id, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [alertId, title, message, alertType, severity || 'medium', userId, relatedEntityType, relatedEntityId]
    );

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { id: alertId }
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert'
    });
  }
});

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const alertId = req.params.id;

    await pool.query('DELETE FROM alerts WHERE id = $1', [alertId]);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert'
    });
  }
});

module.exports = router;
