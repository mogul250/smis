import User from '../models/user.js';
import Student from '../models/student.js';
import { generateToken } from '../config/jwt.js';
import emailService from '../services/email-service.js';
import pool from '../config/database.js';
import crypto from 'crypto';

export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const userId = await User.create({ first_name, last_name, email, password, role });

    res.status(201).json({
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    console.log('Login attempt started for:', req.body.email);
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Searching for user in staff table...');
    // Try to find user in staff table first
    let user = await User.findByEmail(email);
    let userType = 'staff';
    let role = user ? user.role : null;

    if (!user) {
      console.log('User not found in staff table, checking students table...');
      // If not found in staff, try students table
      user = await Student.findByEmail(email);
      userType = 'student';
      role = 'student';
    }

    if (!user) {
      console.log('User not found in either table for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${user.email}, type: ${userType}, role: ${role}`);

    // Check password
    console.log('Verifying password...');
    const isValidPassword = await (userType === 'staff' ? 
      User.verifyPassword(password, user.password_hash) : 
      Student.verifyPassword(password, user.password_hash)
    );
    
    if (!isValidPassword) {
      console.log('Password verification failed for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Password verified successfully');

    // Check if active
    if (!user.is_active) {
      console.log('Account is deactivated for:', email);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    console.log('Generating JWT token...');
    // Generate token with user type and role
    const token = generateToken({
      id: user.id,
      role: role,
      userType: userType
    });

    console.log('Token generated successfully');

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log('Login successful for:', email);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: role,
        userType: userType
      },
      token
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });
    
    // More specific error messages based on error type
    if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({ 
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid input data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

export const getProfile = async (req, res) => {
  try {
    let user;

    if (req.user.userType === 'staff') {
      user = await User.findById(req.user.id);
    } else if (req.user.userType === 'student') {
      user = await Student.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: req.user.role,
        userType: req.user.userType,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    const query = `
      UPDATE users
      SET reset_token = ?, reset_token_expiry = ?
      WHERE id = ?
    `;
    await pool.execute(query, [resetToken, resetTokenExpiry, user.id]);

    // Send reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with valid reset token
    const query = `
      SELECT id, email, first_name, last_name
      FROM users
      WHERE reset_token = ? AND reset_token_expiry > NOW()
    `;
    const [rows] = await pool.execute(query, [token]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = rows[0];

    // Hash new password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const updateQuery = `
      UPDATE users
      SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL
      WHERE id = ?
    `;
    await pool.execute(updateQuery, [hashedPassword, user.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find student
    const student = await Student.findByEmail(email);
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await Student.verifyPassword(password, student.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if active
    if (!student.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken({
      id: student.id,
      role: 'student',
      userType: 'student'
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        id: student.id,
        email: student.email,
        role: 'student',
        userType: 'student'
      },
      token
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { register, login, logout, getProfile, requestPasswordReset, resetPassword, studentLogin };
