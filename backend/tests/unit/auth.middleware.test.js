import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../src/middleware/auth-middleware.js';
import User from '../../src/models/user.js';
import Student from '../../src/models/student.js';

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      cookie: sinon.stub()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('authenticate', () => {
    it('should authenticate with valid JWT token for staff user', async () => {
      const fakeUser = { id: 1, role: 'teacher', userType: 'staff' };
      const fakeToken = 'validtoken';
      req.cookies.token = fakeToken;

      sinon.stub(jwt, 'verify').returns({ id: 1, role: 'teacher', userType: 'staff' });
      sinon.stub(User, 'findById').resolves(fakeUser);

      await authenticate(req, res, next);

      expect(req.user).to.deep.equal(fakeUser);
      expect(next.calledOnce).to.be.true;
    });

    it('should authenticate with valid JWT token for student user', async () => {
      const fakeStudent = { id: 1, role: 'student', userType: 'student' };
      const fakeToken = 'validtoken';
      req.cookies.token = fakeToken;

      sinon.stub(jwt, 'verify').returns({ id: 1, role: 'student', userType: 'student' });
      sinon.stub(Student, 'findById').resolves(fakeStudent);

      await authenticate(req, res, next);

      expect(req.user).to.deep.equal(fakeStudent);
      expect(next.calledOnce).to.be.true;
    });

    it('should return 401 for missing token', async () => {
      await authenticate(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'Access token required' })).to.be.true;
    });

    it('should return 401 for invalid token', async () => {
      req.cookies.token = 'invalidtoken';
      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));

      await authenticate(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid token' })).to.be.true;
    });

    it('should return 401 for user not found', async () => {
      req.cookies.token = 'validtoken';
      sinon.stub(jwt, 'verify').returns({ id: 1, role: 'teacher', userType: 'staff' });
      sinon.stub(User, 'findById').resolves(null);

      await authenticate(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
    });

    it('should return 401 for inactive user', async () => {
      const fakeUser = { id: 1, role: 'teacher', userType: 'staff', is_active: false };
      req.cookies.token = 'validtoken';
      sinon.stub(jwt, 'verify').returns({ id: 1, role: 'teacher', userType: 'staff' });
      sinon.stub(User, 'findById').resolves(fakeUser);

      await authenticate(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'Account is deactivated' })).to.be.true;
    });
  });
});
