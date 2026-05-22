// Task Routes
// Task management and assignment operations

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT t.*, ts.name as status_name,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name
      FROM tasks t
      JOIN task_statuses ts ON t.status_id = ts.id
      JOIN users u ON t.assigned_by_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND ts.name = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY t.due_date ASC, t.priority DESC 
              LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Get user's assigned tasks
router.get('/assigned', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT t.*, ts.name as status_name, ta.id as assignment_id, ta.completion_percentage
       FROM tasks t
       JOIN task_statuses ts ON t.status_id = ts.id
       JOIN task_assignments ta ON t.id = ta.task_id
       WHERE ta.assigned_to_id = $1
       ORDER BY t.due_date ASC, t.priority DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned tasks'
    });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, scheduledDate, dueDate, location, isRecurring, recurrencePattern } = req.body;
    const assignedById = req.user.id;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title required'
      });
    }

    // Get pending status ID
    const statusResult = await pool.query(
      `SELECT id FROM task_statuses WHERE name = 'pending'`
    );

    const taskId = uuidv4();
    await pool.query(
      `INSERT INTO tasks (id, title, description, status_id, priority, assigned_by_id, 
        scheduled_date, due_date, location, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [taskId, title, description, statusResult.rows[0].id, priority || 'medium', assignedById,
       scheduledDate, dueDate, location, isRecurring || false, recurrencePattern]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { id: taskId }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Assign task to staff
router.post('/:taskId/assign', async (req, res) => {
  try {
    const { assignedToId } = req.body;
    const { taskId } = req.params;

    if (!assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user ID required'
      });
    }

    const assignmentId = uuidv4();
    await pool.query(
      `INSERT INTO task_assignments (id, task_id, assigned_to_id, status)
       VALUES ($1, $2, $3, 'pending')`,
      [assignmentId, taskId, assignedToId]
    );

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully'
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign task'
    });
  }
});

// Update task status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status required'
      });
    }

    // Get status ID
    const statusResult = await pool.query(
      `SELECT id FROM task_statuses WHERE name = $1`,
      [status]
    );

    if (statusResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await pool.query(
      `UPDATE tasks SET status_id = $1 WHERE id = $2`,
      [statusResult.rows[0].id, taskId]
    );

    res.json({
      success: true,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
});

// Mark task assignment as complete
router.post('/:taskId/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    // Update assignment status
    await pool.query(
      `UPDATE task_assignments 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completion_percentage = 100
       WHERE task_id = $1 AND assigned_to_id = $2`,
      [taskId, userId]
    );

    // Update task status
    const completedStatusResult = await pool.query(
      `SELECT id FROM task_statuses WHERE name = 'completed'`
    );

    await pool.query(
      `UPDATE tasks SET status_id = $1, completion_date = CURRENT_DATE WHERE id = $2`,
      [completedStatusResult.rows[0].id, taskId]
    );

    res.json({
      success: true,
      message: 'Task completed successfully'
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task'
    });
  }
});

module.exports = router;
