// Ticket Routes
// Create, read, update, delete ticket operations

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { status, priority, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT t.*, ts.name as status_name, 
        CONCAT(u.first_name, ' ', u.last_name) as assigned_name
      FROM tickets t
      JOIN ticket_statuses ts ON t.status_id = ts.id
      LEFT JOIN users u ON t.assigned_to_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND ts.name = $${params.length + 1}`;
      params.push(status);
    }

    if (priority) {
      query += ` AND t.priority = $${params.length + 1}`;
      params.push(priority);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
});

// Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, ts.name as status_name FROM tickets t
       JOIN ticket_statuses ts ON t.status_id = ts.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Get comments
    const commentsResult = await pool.query(
      `SELECT tc.*, u.first_name, u.last_name FROM ticket_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.ticket_id = $1 ORDER BY tc.created_at DESC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        comments: commentsResult.rows
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
});

// Create ticket
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, location } = req.body;
    const reporterId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description required'
      });
    }

    // Get open status ID
    const statusResult = await pool.query(
      `SELECT id FROM ticket_statuses WHERE name = 'open'`
    );

    const ticketId = uuidv4();
    await pool.query(
      `INSERT INTO tickets (id, title, description, status_id, priority, reporter_id, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ticketId, title, description, statusResult.rows[0].id, priority || 'medium', reporterId, location]
    );

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: { id: ticketId }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket'
    });
  }
});

// Update ticket
router.put('/:id', async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    let updateQuery = 'UPDATE tickets SET ';
    const params = [];
    const setParts = [];

    if (status) {
      const statusResult = await pool.query(
        `SELECT id FROM ticket_statuses WHERE name = $1`,
        [status]
      );
      if (statusResult.rows.length > 0) {
        setParts.push(`status_id = $${params.length + 1}`);
        params.push(statusResult.rows[0].id);
      }
    }

    if (priority) {
      setParts.push(`priority = $${params.length + 1}`);
      params.push(priority);
    }

    if (assignedTo) {
      setParts.push(`assigned_to_id = $${params.length + 1}`);
      params.push(assignedTo);
    }

    if (setParts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateQuery += setParts.join(', ') + ` WHERE id = $${params.length + 1}`;
    params.push(req.params.id);

    await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket'
    });
  }
});

// Add comment to ticket
router.post('/:id/comments', async (req, res) => {
  try {
    const { comment } = req.body;
    const userId = req.user.id;
    const ticketId = req.params.id;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty'
      });
    }

    const commentId = uuidv4();
    await pool.query(
      `INSERT INTO ticket_comments (id, ticket_id, user_id, comment)
       VALUES ($1, $2, $3, $4)`,
      [commentId, ticketId, userId, comment]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

module.exports = router;
