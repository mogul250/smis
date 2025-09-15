# School Management Information System (SMIS)

A comprehensive web-based platform designed to digitize and streamline school management processes, providing dedicated portals for students, teachers, Heads of Departments (HODs), finance personnel, and administrators.

## 🎯 Project Overview

The SMIS aims to modernize educational institution management by offering a centralized system that handles student information, attendance tracking, academic performance, financial management, and seamless communication between all stakeholders. This system reduces paperwork, minimizes errors, and enhances transparency and efficiency in school operations.

## ✨ Key Features

### Student Portal
- **Profile Management**: View and update personal information
- **Academic Tracking**: Access grades, attendance records, and performance history
- **Timetable View**: Check class schedules and academic calendar
- **Fee Management**: View statements, payment status, and outstanding balances
- **Announcements**: Stay updated with school news and notifications

### Teacher Portal
- **Class Management**: Handle assigned courses and student lists
- **Attendance Recording**: Mark daily attendance for classes
- **Grade Entry**: Input and manage student grades and marks
- **Resource Sharing**: Upload course materials and lesson plans
- **Communication**: Interact with students and HODs

### Head of Department (HOD) Portal
- **Teacher Oversight**: Monitor teacher performance and activities
- **Course Management**: Allocate and manage departmental courses
- **Report Generation**: Create departmental performance reports
- **Timetable Approval**: Review and approve schedule changes
- **Department Analytics**: View attendance, grades, and performance metrics

### Finance Module
- **Fee Management**: Track student fees, payments, and balances
- **Invoice Generation**: Create and send payment invoices
- **Payment Processing**: Record and verify fee payments
- **Financial Reporting**: Generate financial summaries and analytics
- **Audit Trail**: Maintain payment history and transaction logs

### Administrator Module
- **User Management**: Create and manage user accounts for all roles
- **Academic Calendar**: Set up and manage school events and holidays
- **Timetable Setup**: Create and manage master class schedules
- **System Reports**: Generate comprehensive system-wide analytics
- **Configuration**: Manage system settings and permissions

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, CORS
- **Testing**: Mocha, Chai, Supertest

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Charts**: Chart.js

### DevOps & Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Version Control**: Git
- **Environment**: dotenv

## 📁 Project Structure

```
SMIS/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic services
│   │   ├── config/          # Configuration files
│   │   ├── utils/           # Utility functions
│   │   └── tests/           # Unit and integration tests
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service functions
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # Styling files
│   ├── public/              # Static assets
│   ├── package.json
│   ├── next.config.js
│   └── Dockerfile
├── database/                # Database files
│   ├── migrations/          # Database migration scripts
│   ├── seeds/               # Seed data
│   └── schema.sql           # Database schema
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── user-guides/         # User manuals
│   └── deployment/          # Deployment guides
├── docker-compose.yml       # Docker orchestration
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── PLAN.md                  # Project planning document
└── README.md                # Project documentation
```

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Docker** (optional, for containerized deployment)
- **Git** (for version control)

## 🚀 Installation and Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SMIS
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smis_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb smis_db

# Run database migrations
psql -d smis_db -f database/schema.sql
```

### 4. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# For production
npm start
```

### 5. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### 6. Using Docker (Alternative)
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d
```

## 📖 Usage

### Accessing the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### User Roles and Credentials
The system supports multiple user roles:
- **Administrator**: Full system access
- **Head of Department**: Department management
- **Teacher**: Class and student management
- **Student**: Personal academic access
- **Finance Officer**: Financial operations

### API Documentation
API endpoints are documented in `docs/api/`. Key endpoints include:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

#### Student Endpoints
- `GET /api/student/profile` - Get student profile
- `GET /api/student/grades` - Get student grades
- `GET /api/student/attendance` - Get attendance records
- `GET /api/student/fees` - Get fee information

#### Teacher Endpoints
- `GET /api/teacher/classes` - Get assigned classes
- `POST /api/teacher/attendance` - Mark attendance
- `POST /api/teacher/grades` - Enter grades

#### Admin Endpoints
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users` - List all users
- `PUT /api/admin/timetable` - Update timetable

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- tests/auth.test.js

# Run with coverage
npm run test:coverage
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚢 Deployment

### Production Deployment
1. **Environment Setup**: Configure production environment variables
2. **Database**: Set up production PostgreSQL database
3. **Build Application**:
   ```bash
   # Backend
   cd backend
   npm run build

   # Frontend
   cd frontend
   npm run build
   ```
4. **Docker Deployment**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring tools set up
- [ ] Backup strategy implemented

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `docs/`

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core functionality
- User authentication and authorization
- Student, Teacher, HOD, Finance, and Admin portals
- Basic reporting and analytics
- Docker containerization support

### Future Releases
- Mobile application development
- Advanced analytics dashboard
- Integration with third-party services
- Enhanced security features
- Performance optimizations

---

**Built with ❤️ for educational institutions**
