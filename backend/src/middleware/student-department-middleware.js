import Student from '../models/student.js';

/**
 * Middleware to enforce department-based access control for students
 * Adds student's department information to the request object
 */
export const enforceStudentDepartmentAccess = async (req, res, next) => {
  try {
    // Only apply to student users
    if (req.user && req.user.role === 'student') {
      console.log('🔍 Student department middleware - checking student:', req.user.id);
      
      const student = await Student.findById(req.user.id);
      if (!student) {
        console.log('❌ Student not found:', req.user.id);
        return res.status(404).json({ message: 'Student not found' });
      }

      if (!student.department_id) {
        console.log('⚠️ Student has no department assigned:', req.user.id);
        return res.status(400).json({ message: 'Student is not assigned to any department' });
      }

      // Add student's department info to request
      req.studentDepartment = {
        id: student.department_id,
        name: student.department_name
      };
      req.isStudentAccess = true;
      
      console.log('✅ Student department access granted:', {
        studentId: req.user.id,
        departmentId: student.department_id,
        departmentName: student.department_name
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ Student department middleware error:', error);
    res.status(500).json({ message: 'Department access validation failed' });
  }
};

export default { enforceStudentDepartmentAccess };
