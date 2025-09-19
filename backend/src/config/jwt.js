// JWT configuration
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    console.log(err)
    return null;
  }
};

export { generateToken, verifyToken };
