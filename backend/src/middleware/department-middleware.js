import Teacher from '../models/teacher.js';

// Middleware to authorize department-level access for HOD
const authorizeDepartment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const hod = await Teacher.findByUserId(userId);

    if (!hod) {
      return res.status(403).json({ message: 'Access denied. Not an HOD.' });
    }

    // Attach department info to request for use in controllers
    req.department = {
      id: hod.department_id,
      hodId: hod.id
    };

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

export default authorizeDepartment;
