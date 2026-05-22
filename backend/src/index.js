// Facility Management System - Backend Main Entry Point
// Author: ithelpdesk78
// Description: Express server setup with PostgreSQL connection

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const ticketRoutes = require('./routes/ticket.routes');
const taskRoutes = require('./routes/task.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const alertRoutes = require('./routes/alert.routes');
const reportRoutes = require('./routes/report.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

// Import database
const pool = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middleware - Security
app.use(helmet());

// Middleware - CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware - Logging
app.use(morgan('combined'));

// Middleware - Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware - Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'OK',
      timestamp: result.rows[0].now,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed'
    });
  }
});

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes (require authentication)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection established:', result.rows[0].now);

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║     Facility Management System API Server      ║
║                                                ║
║  Server running on port ${PORT}                   ║
║  Environment: ${process.env.NODE_ENV}                  ║
║  API URL: http://localhost:${PORT}/api        ║
║                                                ║
║  Admin User:                                   ║
║  Email: ${process.env.ADMIN_EMAIL}            ║
║  Name: ${process.env.ADMIN_NAME}                     ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
