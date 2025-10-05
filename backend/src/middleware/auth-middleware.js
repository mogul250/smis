import { verifyToken } from '../config/jwt.js';
import User from '../models/user.js';
import Student from '../models/student.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      // Check cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    console.log('Auth middleware - decoded token:', decoded);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    let user;
    if (decoded.userType === 'staff') {
      console.log('Looking up staff user with ID:', decoded.id);
      user = await User.findById(decoded.id);
    } else if (decoded.userType === 'student') {
      console.log('Looking up student user with ID:', decoded.id);
      user = await Student.findById(decoded.id);
    }

    console.log('Auth middleware - found user:', user);
    if (!user) {
      console.log('Auth middleware - user not found');
      return res.status(401).json({ message: 'User not found' });
    }
    if (Object.prototype.hasOwnProperty.call(user, 'is_active') && user.is_active === false) {
      console.log('Auth middleware - user is inactive');
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      userType: decoded.userType
    };
    console.log('Auth middleware - setting req.user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default { authenticate };
