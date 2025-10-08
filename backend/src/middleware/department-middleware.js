import pool from '../config/database.js';

// Middleware to authorize department-level access for HOD and Admin
const authorizeDepartment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin users have access to all departments
    if (userRole === 'admin') {
      // For admin users, we need to get the department from the request parameters
      const departmentId = req.params.departmentId || req.body.departmentId;
      if (departmentId) {
        const [deptRows] = await pool.execute('SELECT id, name, head_id FROM departments WHERE id = ?', [departmentId]);
        if (deptRows.length > 0) {
          req.department = {
            id: deptRows[0].id,
            name: deptRows[0].name,
            hodId: deptRows[0].head_id
          };
          return next();
        }
      }
      // If no specific department ID, allow access (admin can access all)
      req.department = { id: null, name: 'All Departments', hodId: null };
      return next();
    }

    // For HOD users, check if they are HOD of any department
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
