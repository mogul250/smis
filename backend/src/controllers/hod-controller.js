import Teacher from '../models/teacher.js';
import Department from '../models/department.js';
import Course from '../models/course.js';
import Timetable from '../models/timetable.js';
import Attendance from '../models/attendance.js';
import Grade from '../models/grade.js';
import pool from '../config/database.js';

class HodController {
  // Get list of teachers in the department
  static async getDepartmentTeachers(req, res) {
    try {
      const teachers = await Teacher.findByDepartment(req.department.id);
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Approve or reject teacher activities (e.g., grade entries)
  static async approveTeacherActivity(req, res) {
    try {
      const { activityType, activityId, approve } = req.body;

      if (!['grade', 'attendance'].includes(activityType)) {
        return res.status(400).json({ message: 'Invalid activity type' });
      }

      if (activityType === 'grade') {
        // Approve grade entry - ensure it belongs to department
        const query = `
          UPDATE grades g
          JOIN courses c ON g.course_id = c.id
          SET g.status = ?
          WHERE g.id = ? AND c.department_id = ?
        `;
        const status = approve ? 'approved' : 'rejected';
        const [result] = await pool.execute(query, [status, activityId, req.department.id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Grade entry not found in your department' });
        }
      } else if (activityType === 'attendance') {
        // Approve attendance marking - ensure it belongs to department
        const query = `
          UPDATE attendance a
          JOIN courses c ON a.course_id = c.id
          SET a.status = ?
          WHERE a.id = ? AND c.department_id = ?
        `;
        const status = approve ? 'approved' : 'rejected';
        const [result] = await pool.execute(query, [status, activityId, req.department.id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Attendance record not found in your department' });
        }
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
      const hod = await Teacher.findByUserId(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { reportType, semester, year } = req.query;

      let report = {};

      if (reportType === 'attendance') {
        // Generate attendance report
        const query = `
          SELECT c.name as course_name, c.code as course_code,
                 COUNT(a.id) as total_classes,
                 SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                 ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) as attendance_percentage
          FROM courses c
          LEFT JOIN attendance a ON c.id = a.course_id
          WHERE c.department_id = ? ${semester ? 'AND a.semester = ?' : ''} ${year ? 'AND YEAR(a.date) = ?' : ''}
          GROUP BY c.id, c.name, c.code
        `;
        const params = [hod.department_id];
        if (semester) params.push(semester);
        if (year) params.push(year);
        const [rows] = await pool.execute(query, params);
        report.attendance = rows;
      } else if (reportType === 'grades') {
        // Generate grade distribution report
        const query = `
          SELECT c.name as course_name, c.code as course_code,
                 g.grade, COUNT(*) as count
          FROM courses c
          JOIN grades g ON c.id = g.course_id
          WHERE c.department_id = ? ${semester ? 'AND g.semester = ?' : ''} ${year ? 'AND g.year = ?' : ''}
          GROUP BY c.id, c.name, c.code, g.grade
          ORDER BY c.name, g.grade
        `;
        const params = [hod.department_id];
        if (semester) params.push(semester);
        if (year) params.push(year);
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
      const hod = await Teacher.findByUserId(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { action, courseData } = req.body;

      if (!['add', 'edit', 'delete'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      if (action === 'add') {
        courseData.department_id = hod.department_id;
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
      const hod = await Teacher.findByUserId(userId);
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
      const [rows] = await pool.execute(query, [timetableId, hod.department_id]);
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
      const hod = await Teacher.findByUserId(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { semester, year } = req.query;

      // Overall attendance statistics
      const attendanceQuery = `
        SELECT
          COUNT(*) as total_records,
          ROUND(AVG(CASE WHEN status = 'present' THEN 100 ELSE 0 END), 2) as avg_attendance_percentage
        FROM attendance a
        JOIN courses c ON a.course_id = c.id
        WHERE c.department_id = ? ${semester ? 'AND a.semester = ?' : ''} ${year ? 'AND YEAR(a.date) = ?' : ''}
      `;
      const attendanceParams = [hod.department_id];
      if (semester) attendanceParams.push(semester);
      if (year) attendanceParams.push(year);
      const [attendanceStats] = await pool.execute(attendanceQuery, attendanceParams);

      // Grade distribution
      const gradeQuery = `
        SELECT grade, COUNT(*) as count
        FROM grades g
        JOIN courses c ON g.course_id = c.id
        WHERE c.department_id = ? ${semester ? 'AND g.semester = ?' : ''} ${year ? 'AND g.year = ?' : ''}
        GROUP BY grade
        ORDER BY grade
      `;
      const gradeParams = [hod.department_id];
      if (semester) gradeParams.push(semester);
      if (year) gradeParams.push(year);
      const [gradeStats] = await pool.execute(gradeQuery, gradeParams);

      // Course count
      const courseQuery = 'SELECT COUNT(*) as course_count FROM courses WHERE department_id = ?';
      const [courseStats] = await pool.execute(courseQuery, [hod.department_id]);

      // Teacher count
      const teacherQuery = 'SELECT COUNT(*) as teacher_count FROM teachers WHERE department_id = ?';
      const [teacherStats] = await pool.execute(teacherQuery, [hod.department_id]);

      const stats = {
        attendance: attendanceStats[0],
        grades: gradeStats,
        courses: courseStats[0].course_count,
        teachers: teacherStats[0].teacher_count
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
      const hod = await Teacher.findByUserId(userId);
      if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
      }

      const { semester } = req.query;

      // Validation
      if (semester && (typeof semester !== 'string' || semester.trim().length === 0)) {
        return res.status(400).json({ message: 'Invalid semester' });
      }

      // Get all courses in the department
      const courses = await Course.findByDepartment(hod.department_id);
      const courseIds = courses.map(course => course.id);

      if (courseIds.length === 0) {
        return res.json([]);
      }

      // Get timetable for all courses in the department
      const query = `
        SELECT t.*, c.name as course_name, c.code as course_code,
               CONCAT(u.first_name, ' ', u.last_name) as teacher_name
        FROM timetables t
        JOIN courses c ON t.course_id = c.id
        JOIN teachers te ON t.teacher_id = te.id
        JOIN users u ON te.user_id = u.id
        WHERE t.course_id IN (${courseIds.map(() => '?').join(',')})
        ${semester ? 'AND t.semester = ?' : ''}
        ORDER BY t.day, t.start_time
      `;

      const params = semester ? [...courseIds, semester] : courseIds;
      const [rows] = await pool.execute(query, params);

      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default HodController;
