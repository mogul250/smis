import ClassModel from '../models/class.js';
import User from '../models/user.js';
import Student from '../models/student.js';

class ClassController {
  // Get all info for a class (students, head teacher, etc)
  static async getClassInfo(req, res) {
    try {
      const { classId } = req.params;
      if (!classId || isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }
      const cls = await ClassModel.findById(classId);
      if (!cls) {
        return res.status(404).json({ message: 'Class not found' });
      }
      // Get students
      let students = [];
      if (cls.students) {
        const studentIds = typeof cls.students === 'string' ? JSON.parse(cls.students) : cls.students;
        if (Array.isArray(studentIds) && studentIds.length > 0) {
          students = await Student.getByClass(classId);
        }
      }
      // Get head teacher (created_by)
      let headTeacher = null;
      if (cls.created_by) {
        headTeacher = await User.findById(cls.created_by);
      }
      res.json({
        ...cls,
        students,
        headTeacher,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get all classes
  static async getAllClasses(req, res) {
    try {
      const classes = await ClassModel.findAll();
      res.json(classes);
    } catch (error) {
        console.log(error)
      res.status(500).json({ message: "internal server error" });
    }
  }

  // Get classes for a student
  static async getStudentClasses(req, res) {
    try {
      const { studentId } = req.params;
      if (!studentId || isNaN(studentId)) {
        return res.status(400).json({ message: 'Invalid student ID' });
      }
      const classes = await ClassModel.findByStudent(studentId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default ClassController;