# Facility Management System (FMS)

A modern, user-friendly web application for facility management teams with real-time task tracking, ticketing, attendance management, and analytics.

## 🎯 Features

- **Dashboard**: Real-time overview of tasks, tickets, and alerts
- **Ticket Management**: Create, assign, and track issue tickets
- **Task Management**: Create recurring tasks with proof of completion
- **Attendance System**: QR code check-in/check-out with punctuality tracking
- **Alerts & Notifications**: Threshold-based and event-driven alerts
- **Reports & Analytics**: Performance metrics and trends
- **Media Uploads**: Images and audio notes for task proof
- **Role-Based Access**: Super Admin, Facility Manager, and Staff roles

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API client

### Backend
- **Node.js + Express.js** - Server framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads

### Deployment
- **Docker & Docker Compose** - Containerization
- **Ubuntu Linux** - Server OS
- **Nginx** - Reverse proxy (optional)

## 📁 Project Structure

```
facility-management-system/
├── frontend/                    # React application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── styles/
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── database/                    # PostgreSQL setup
│   ├── init.sql
│   └── schema.sql
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Installation & Deployment

1. **Clone the repository**
```bash
git clone https://github.com/ithelpdesk78/facility-management-system.git
cd facility-management-system
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start Docker containers**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

5. **Default credentials**
- Email: admin@fms.com
- Password: Admin@123456

## 📊 User Roles

| Role | Permissions |
|------|------------|
| **Super Admin** | Full system control, user management, analytics |
| **Facility Manager** | Task assignment, ticket management, team monitoring |
| **Staff** | View tasks, update status, submit proof, report issues |

## 🔐 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control (RBAC)
- Input validation and sanitization
- Secure file upload handling
- Environment variable secrets

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Dashboard
- `GET /api/dashboard/summary` - Dashboard overview

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Mark task complete

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/report` - Attendance report

### Users
- `GET /api/users` - List users (Admin)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)

## 🗄️ Database Schema

Key tables:
- `users` - User accounts and profiles
- `roles` - User roles (Super Admin, Manager, Staff)
- `tickets` - Issue tickets
- `tasks` - Work tasks
- `task_assignments` - Task assignments to staff
- `attendance` - Attendance logs
- `alerts` - System alerts
- `media` - Uploaded files

## 🐳 Docker Deployment

### Docker Compose Services
- **frontend** - React app (Port 3000)
- **backend** - Express API (Port 5000)
- **postgres** - PostgreSQL database (Port 5432)

### Environment Variables (.env)
```
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fms_db
DB_USER=fms_user
DB_PASSWORD=your_secure_password

# Backend
BACKEND_PORT=5000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key

# Frontend
REACT_APP_API_URL=http://localhost:5000/api

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/uploads
```

### Persistent Volumes
```yaml
volumes:
  postgres_data: /var/lib/postgresql/data
  uploads: /app/uploads
```

## 📈 Development Phases

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Dashboard
- ✅ Ticket management
- ✅ Task management
- ✅ Docker deployment

### Phase 2
- Attendance system
- Notifications
- Reports & Analytics
- Media uploads

### Phase 3
- AI-powered features
- Predictive alerts
- Mobile app
- IoT integrations

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Development Guidelines

- Keep components small and reusable
- Use meaningful variable and function names
- Add comments for complex logic
- Follow REST API conventions
- Test frequently
- Keep database queries optimized
- Use environment variables for configuration

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit pull request

## 📞 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact: admin@fms.com

## 📄 License

This project is proprietary and confidential.

## 👥 Team

- **Admin**: Sachin
- **Owner**: ithelpdesk78

---

**Last Updated**: 2026-05-22
**Version**: 1.0.0
