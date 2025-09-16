import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';
import studentRoutes from '../../src/routes/student-routes.js';
import StudentController from '../../src/controllers/student-controller.js';
import { authenticate } from '../../src/middleware/auth-middleware.js';
import { authorize } from '../../src/middleware/role-middleware.js';

describe('Student Routes', () => {
  let app;
  let authStub;
  let roleStub;

  beforeEach(() => {
    // Mock middleware before creating the app
    authStub = sinon.stub().callsFake((req, res, next) => next());
    roleStub = sinon.stub().callsFake(() => (req, res, next) => next());

    // Replace the middleware functions
    sinon.replace(authenticate, authStub);
    sinon.replace(authorize, roleStub);

    app = express();
    app.use(express.json());
    app.use('/api/students', studentRoutes);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/students/profile', () => {
    it('should call StudentController.getProfile', async () => {
      const fakeController = sinon.stub(StudentController, 'getProfile').callsFake((req, res) => {
        res.json({ message: 'Profile retrieved' });
      });

      // Mock middleware - since these are functions, we need to stub them directly
      // But since the routes are already loaded, we'll skip middleware stubbing for now
      // and focus on testing the controller calls

      const response = await request(app).get('/api/students/profile');

      expect(fakeController.calledOnce).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ message: 'Profile retrieved' });
    });
  });

  describe('PUT /api/students/profile', () => {
    it('should call StudentController.updateProfile', async () => {
      const fakeController = sinon.stub(StudentController, 'updateProfile').callsFake((req, res) => {
        res.json({ message: 'Profile updated' });
      });

      // Mock middleware - since these are functions, we need to stub them directly
      // But since the routes are already loaded, we'll skip middleware stubbing for now
      // and focus on testing the controller calls

      const response = await request(app)
        .put('/api/students/profile')
        .send({ first_name: 'Updated' });

      expect(fakeController.calledOnce).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ message: 'Profile updated' });
    });
  });

  describe('GET /api/students/attendance', () => {
    it('should call StudentController.getAttendance', async () => {
      const fakeController = sinon.stub(StudentController, 'getAttendance').callsFake((req, res) => {
        res.json([{ date: '2023-01-01', status: 'present' }]);
      });

      // Mock middleware - since these are functions, we need to stub them directly
      // But since the routes are already loaded, we'll skip middleware stubbing for now
      // and focus on testing the controller calls

      const response = await request(app).get('/api/students/attendance');

      expect(fakeController.calledOnce).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal([{ date: '2023-01-01', status: 'present' }]);
    });
  });

  describe('GET /api/students/grades', () => {
    it('should call StudentController.getGrades', async () => {
      const fakeController = sinon.stub(StudentController, 'getGrades').callsFake((req, res) => {
        res.json({ grades: [], gpa: 0 });
      });

      // Mock middleware - since these are functions, we need to stub them directly
      // But since the routes are already loaded, we'll skip middleware stubbing for now
      // and focus on testing the controller calls

      const response = await request(app).get('/api/students/grades');

      expect(fakeController.calledOnce).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ grades: [], gpa: 0 });
    });
  });

  describe('GET /api/students/fees', () => {
    it('should call StudentController.getFees', async () => {
      const fakeController = sinon.stub(StudentController, 'getFees').callsFake((req, res) => {
        res.json({ fees: [], totalOutstanding: 0 });
      });

      // Mock middleware - since these are functions, we need to stub them directly
      // But since the routes are already loaded, we'll skip middleware stubbing for now
      // and focus on testing the controller calls

      const response = await request(app).get('/api/students/fees');

      expect(fakeController.calledOnce).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ fees: [], totalOutstanding: 0 });
    });
  });

  describe('GET /api/students/timetable', () => {
    it('should call StudentController.getTimetable', async () => {
      const fakeController = sinon.stub(StudentController, 'getTimetable').callsFake((req, res) => {
        res.json([{ course_name: 'Math', start_time: '09:00' }]);
      });

      // Mock middleware - since these are functions, we need to stub them directly
      // But since the routes are already loaded, we'll skip middleware stubbing for now
      // and focus on testing the controller calls

      const response = await request(app).get('/api/students/timetable');

      expect(fakeController.calledOnce).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal([{ course_name: 'Math', start_time: '09:00' }]);
    });
  });
});
