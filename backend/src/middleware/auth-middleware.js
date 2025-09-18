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
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    let user;
    if (decoded.userType === 'staff') {
      user = await User.findById(decoded.id);
    } else if (decoded.userType === 'student') {
      user = await Student.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (Object.prototype.hasOwnProperty.call(user, 'is_active') && user.is_active === false) {
      return res.status(401).json({ message: 'Account is deactivated' });
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
