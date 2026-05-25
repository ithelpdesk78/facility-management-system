// User Management Routes
// Admin user management operations

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { roleMiddleware } = require('../middleware/auth.middleware');

// Get all users (Admin only)
router.get('/', roleMiddleware('SUPER_ADMIN', 'FACILITY_MANAGER'), async (req, res) => {
  try {
    const { role, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active,
        r.name as role, u.last_login, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND r.name = $${params.length + 1}`;
      params.push(role);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active,
        r.name as role, u.last_login, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Create user (Admin only)
router.post('/', roleMiddleware('SUPER_ADMIN'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'STAFF' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Get role ID
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, hashedPassword, firstName, lastName, phone, roleResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: userId, email, firstName, lastName }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user (Admin only)
router.put('/:id', roleMiddleware('SUPER_ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, phone, role, isActive } = req.body;
    const userId = req.params.id;

    let updateQuery = 'UPDATE users SET ';
    const params = [];
    const setParts = [];

    if (firstName !== undefined) {
      setParts.push(`first_name = $${params.length + 1}`);
      params.push(firstName);
    }

    if (lastName !== undefined) {
      setParts.push(`last_name = $${params.length + 1}`);
      params.push(lastName);
    }

    if (phone !== undefined) {
      setParts.push(`phone = $${params.length + 1}`);
      params.push(phone);
    }

    if (role !== undefined) {
      const roleResult = await pool.query(
        'SELECT id FROM roles WHERE name = $1',
        [role]
      );
      if (roleResult.rows.length > 0) {
        setParts.push(`role_id = $${params.length + 1}`);
        params.push(roleResult.rows[0].id);
      }
    }

    if (isActive !== undefined) {
      setParts.push(`is_active = $${params.length + 1}`);
      params.push(isActive);
    }

    if (setParts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateQuery += setParts.join(', ') + ` WHERE id = $${params.length + 1}`;
    params.push(userId);

    await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', roleMiddleware('SUPER_ADMIN'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting the admin user
    const userResult = await pool.query(
      `SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].name === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get user profile (Self)
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active,
        r.name as role, u.last_login, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user password (Self)
router.put('/profile/change-password', async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords required'
      });
    }

    // Get user password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;
