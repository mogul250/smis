import pool from '../config/database.js';

// Middleware to authorize department-level access for HOD
const authorizeDepartment = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user is HOD of any department
    const [deptRows] = await pool.execute('SELECT id, name FROM departments WHERE head_id = ?', [userId]);

    if (deptRows.length === 0) {
      return res.status(403).json({ message: 'Access denied. Not an HOD.' });
    }

    // Attach department info to request for use in controllers
    req.department = {
      id: deptRows[0].id,
      name: deptRows[0].name,
      hodId: userId
    };

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

export default authorizeDepartment;
