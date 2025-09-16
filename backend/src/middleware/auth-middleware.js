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

    let user;
    if (decoded.userType === 'staff') {
      user = await User.findById(decoded.id);
    } else if (decoded.userType === 'student') {
      user = await Student.findById(decoded.id);
    }

    if (!user || !user.is_active) {
      return res.status(403).json({ message: 'Invalid or inactive user' });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      userType: decoded.userType
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default { authenticate };
