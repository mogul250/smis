# SMIS Setup and Testing Guide

## Prerequisites
- MySQL 8.0 installed and running
- Node.js installed
- MySQL root password

## Step 1: Database Setup

### 1.1 Update MySQL Password
Edit the `backend/.env` file and replace `your_mysql_password_here` with your actual MySQL root password:

```env
DB_PASS=your_actual_mysql_password
```

### 1.2 Create Database and Tables
Run the database setup script:

```bash
cd backend
node setup-database.js
```

This will:
- Create the `smis` database
- Create all necessary tables
- Set up the database schema

### 1.3 Test Database Connection
```bash
node test-db-connection.js
```

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Start Backend Server
```bash
npm start
```

The server should start on port 5000. You should see:
```
Server running on port 5000
Connected to MySQL database
```

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Start Frontend Development Server
```bash
npm run dev
```

The frontend should start on port 3000.

## Step 4: Test Authentication

### 4.1 Test Backend Endpoints
```bash
cd backend
node test-auth-endpoints.js
```

### 4.2 Test Frontend Integration
1. Open http://localhost:3000/register
2. Create a new account
3. Go to http://localhost:3000/login
4. Login with the created account

## Troubleshooting

### Database Connection Issues
- Make sure MySQL is running
- Check the password in `.env` file
- Verify MySQL service is started

### Backend Issues
- Check if port 5000 is available
- Verify database connection
- Check console for error messages

### Frontend Issues
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify API calls in Network tab

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (staff)
- `POST /api/auth/student/login` - Login (student)
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### Test Data
You can use these test accounts:
- Email: `john.doe@test.com`
- Password: `password123`
- Role: `teacher`

