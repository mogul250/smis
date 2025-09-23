import User from '../models/user.js';
import Department from '../models/department.js';
import Course from '../models/course.js';
import Timetable from '../models/timetable.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import pool from '../config/database.js';

class HodController {
  // Get HOD profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      // Get department information
      const department = req.department || null;

      const profile = {
        user: {
          id: hod.id,
          first_name: hod.first_name,
          last_name: hod.last_name,
          email: hod.email,
          role: hod.role
        },
        department: department
      };

      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get list of teachers in the department
  static async getDepartmentTeachers(req, res) {
    try {
      const teachers = await User.findByDepartment(req.department.id);
      const filteredTeachers = teachers.filter(user => user.role === 'teacher');
      res.json(filteredTeachers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Approve or reject teacher activities (e.g., grade entries)
  static async approveTeacherActivity(req, res) {
    try {
      const { activityType, activityId, approve } = req.body;

      if (activityType !== 'grade') {
        return res.status(400).json({ message: 'Invalid activity type' });
      }

      // Approve grade entry - ensure it belongs to department
      const query = `
        UPDATE grades g
        JOIN users u ON g.teacher_id = u.id
        SET g.status = ?
        WHERE g.id = ? AND u.department_id = ?
      `;
      const status = approve ? 'approved' : 'rejected';
      const [result] = await pool.execute(query, [status, activityId, req.department.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Grade entry not found in your department' });
      }


      res.json({ message: `${activityType} activity ${activityId} has been ${approve ? 'approved' : 'rejected'}` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Generate departmental reports
  static async generateReports(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { reportType } = req.params;
      const { semester, year } = req.body;



      let report = {};

      if (reportType === 'attendance') {
        // Generate attendance report
        const query = `
          SELECT c.name as course_name, c.course_code as course_code,
                 COUNT(a.id) as total_classes,
                 SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                 ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) as attendance_percentage
          FROM attendance a
          JOIN courses c ON a.course_id = c.id
          JOIN users u ON a.teacher_id = u.id
          WHERE u.department_id = ?
          GROUP BY c.id, c.name, c.course_code
        `;
        const params = [req.department.id];
        const [rows] = await pool.execute(query, params);
        report.attendance = rows;
      } else if (reportType === 'grades') {
        // Generate grade distribution report
        const query = `
          SELECT c.name as course_name, c.course_code as course_code,
                 g.grade, COUNT(*) as count
          FROM grades g
          JOIN courses c ON g.course_id = c.id
          JOIN users u ON g.teacher_id = u.id
          WHERE u.department_id = ?
          GROUP BY c.id, c.name, c.course_code, g.grade
          ORDER BY c.name, g.grade
        `;
        const params = [req.department.id];
        const [rows] = await pool.execute(query, params);
        report.grades = rows;
      }


      res.json({ reportType, report });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Manage courses in the department (add/edit/delete)
  static async manageCourses(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { action, courseData } = req.body;

      if (!['add', 'edit', 'delete'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      if (action === 'add') {
        courseData.department_id = req.department.id;
        const courseId = await Course.create(courseData);
        return res.json({ message: 'Course added', courseId });
      } else if (action === 'edit') {
        const success = await Course.update(courseData.id, courseData);
        return res.json({ message: success ? 'Course updated' : 'Failed to update course' });
      } else if (action === 'delete') {
        const success = await Course.delete(courseData.id);
        return res.json({ message: success ? 'Course deleted' : 'Failed to delete course' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Approve timetable changes
  static async approveTimetable(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { timetableId, approve } = req.body;

      // Check if timetable belongs to department
      const query = `
        SELECT t.* FROM timetables t
        JOIN courses c ON t.course_id = c.id
        WHERE t.id = ? AND c.department_id = ?
      `;
      const [rows] = await pool.execute(query, [timetableId, req.department.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Timetable not found in your department' });
      }

      // Update timetable status
      const updateQuery = 'UPDATE timetables SET status = ? WHERE id = ?';
      const status = approve ? 'approved' : 'rejected';
      const [result] = await pool.execute(updateQuery, [status, timetableId]);

      res.json({ message: `Timetable ${timetableId} has been ${approve ? 'approved' : 'rejected'}` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get department statistics (attendance, grades, performance)
  static async getDepartmentStats(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { semester, year } = req.query;

      // Overall attendance statistics (robust defaults if table/columns missing)
      let attendanceStatsRow = { total_records: 0, avg_attendance_percentage: 0 };
      try {
        const attendanceQuery = `
          SELECT
            COUNT(*) as total_records,
            ROUND(AVG(CASE WHEN status = 'present' THEN 100 ELSE 0 END), 2) as avg_attendance_percentage
          FROM attendance a
          JOIN users u ON a.teacher_id = u.id
          WHERE u.department_id = ?
        `;
        const attendanceParams = [req.department.id];
        const [attendanceStats] = await pool.execute(attendanceQuery, attendanceParams);
        if (Array.isArray(attendanceStats) && attendanceStats[0]) {
          attendanceStatsRow = attendanceStats[0];
        }
      } catch (e) {
        attendanceStatsRow = { total_records: 0, avg_attendance_percentage: 0 };
      }

      // Grade distribution (robust default)
      let gradeStats = [];
      try {
        const gradeQuery = `
          SELECT grade, COUNT(*) as count
          FROM grades g
          JOIN users u ON g.teacher_id = u.id
          WHERE u.department_id = ?
          GROUP BY grade
          ORDER BY grade
        `;
        const gradeParams = [req.department.id];
        const [gradeRows] = await pool.execute(gradeQuery, gradeParams);
        gradeStats = gradeRows;
      } catch (e) {
        gradeStats = [];
      }

      // Course count (robust default)
      let courseCount = 0;
      try {
        const courseQuery = 'SELECT COUNT(DISTINCT course_id) as course_count FROM timetable t JOIN users u ON t.teacher_id = u.id WHERE u.department_id = ?';
        const [courseStats] = await pool.execute(courseQuery, [req.department.id]);
        courseCount = courseStats[0] ? courseStats[0].course_count : 0;
      } catch (e) {
        courseCount = 0;
      }

      // Teacher count (robust default)
      let teacherCount = 0;
      try {
        const teacherQuery = 'SELECT COUNT(*) as teacher_count FROM users WHERE role = ? AND department_id = ?';
        const [teacherStats] = await pool.execute(teacherQuery, ['teacher', req.department.id]);
        teacherCount = teacherStats[0] ? teacherStats[0].teacher_count : 0;
      } catch (e) {
        teacherCount = 0;
      }

      const stats = {
        attendance: attendanceStatsRow,
        grades: gradeStats,
        courses: courseCount,
        teachers: teacherCount
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // View department timetable
  static async getDepartmentTimetable(req, res) {
    try {
      const userId = req.user.id;
      const hod = await User.findById(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { semester } = req.query;

      // Validation
      if (semester && (typeof semester !== 'string' || semester.trim().length === 0)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }

      // Get timetable for all teachers in the department
      const query = `
        SELECT t.*, c.name as course_name, c.course_code as course_code,
               CONCAT(u.first_name, ' ', u.last_name) as teacher_name
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        JOIN users u ON t.teacher_id = u.id
        WHERE u.department_id = ?
        ${semester ? 'AND t.semester = ?' : ''}
        ORDER BY t.day_of_week, t.start_time
      `;

      const params = [req.department.id];
      if (semester) params.push(semester);
      const [rows] = await pool.execute(query, params);

      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

}

export default HodController;
