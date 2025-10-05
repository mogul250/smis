import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import setupSwagger from './src/config/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './src/routes/auth-routes.js';
import studentRoutes from './src/routes/student-routes.js';
import teacherRoutes from './src/routes/teacher-routes.js';
import hodRoutes from './src/routes/hod-routes.js';
import financeRoutes from './src/routes/finance-routes.js';
import adminRoutes from './src/routes/admin-routes.js';
import notificationRoutes from './src/routes/notification-routes.js';
import courseRoutes from './src/routes/course-routes.js';
import activityRoutes from './src/routes/activity-routes.js';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'SMIS Backend is running'
  });
});
import classRoutes from './src/routes/class-routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/classes', classRoutes);

// Swagger
setupSwagger(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
