import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';

class ReportService {
  // Generate attendance report for a student
  static async generateAttendanceReport(studentId, startDate, endDate) {
    try {
      const query = `
        SELECT a.date, a.status, a.notes, c.name as course_name, t.first_name, t.last_name
        FROM attendance a
        JOIN courses c ON a.course_id = c.id
        JOIN teachers t ON a.teacher_id = t.user_id
        WHERE a.student_id = ? AND a.date BETWEEN ? AND ?
        ORDER BY a.date DESC
      `;
      const [rows] = await pool.execute(query, [studentId, startDate, endDate]);

      // Calculate statistics
      const totalDays = rows.length;
      const presentDays = rows.filter(r => r.status === 'present').length;
      const absentDays = rows.filter(r => r.status === 'absent').length;
      const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      return {
        studentId,
        period: { startDate, endDate },
        records: rows,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage: percentage
        }
      };
    } catch (error) {
      throw new Error(`Error generating attendance report: ${error.message}`);
    }
  }

  // Generate grade report for a student
  static async generateGradeReport(studentId, semester = null, year = null) {
    try {
      let query = `
        SELECT g.grade, g.semester, g.year, g.comments, c.name as course_name,
               c.credits, t.first_name as teacher_first_name, t.last_name as teacher_last_name
        FROM grades g
        JOIN courses c ON g.course_id = c.id
        JOIN teachers te ON g.teacher_id = te.user_id
        JOIN users t ON te.user_id = t.id
        WHERE g.student_id = ?
      `;
      const params = [studentId];

      if (semester) {
        query += ' AND g.semester = ?';
        params.push(semester);
      }
      if (year) {
        query += ' AND g.year = ?';
        params.push(year);
      }

      query += ' ORDER BY g.year DESC, g.semester DESC, c.name';

      const [rows] = await pool.execute(query, params);

      // Calculate GPA
      let totalCredits = 0;
      let totalPoints = 0;

      rows.forEach(row => {
        const gradePoint = this.convertGradeToPoint(row.grade);
        totalCredits += row.credits;
        totalPoints += gradePoint * row.credits;
      });

      const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

      return {
        studentId,
        grades: rows,
        summary: {
          totalCourses: rows.length,
          totalCredits,
          gpa
        }
      };
    } catch (error) {
      throw new Error(`Error generating grade report: ${error.message}`);
    }
  }

  // Generate financial report for a student
  static async generateFinancialReport(studentId) {
    try {
      const query = `
        SELECT f.amount, f.type, f.due_date, f.paid_date, f.status, f.description
        FROM fees f
        WHERE f.student_id = ?
        ORDER BY f.due_date DESC
      `;
      const [rows] = await pool.execute(query, [studentId]);

      const totalPaid = rows.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const totalOutstanding = rows.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const overdueFees = rows.filter(f => f.status === 'pending' && new Date(f.due_date) < new Date());

      return {
        studentId,
        fees: rows,
        summary: {
          totalPaid,
          totalOutstanding,
          overdueCount: overdueFees.length,
          overdueAmount: overdueFees.reduce((sum, f) => sum + parseFloat(f.amount), 0)
        }
      };
    } catch (error) {
      throw new Error(`Error generating financial report: ${error.message}`);
    }
  }

  // Generate department performance report
  static async generateDepartmentReport(departmentId, semester, year) {
    try {
      // Get department info
      const deptQuery = 'SELECT * FROM departments WHERE id = ?';
      const [deptRows] = await pool.execute(deptQuery, [departmentId]);
      const department = deptRows[0];

      // Get students in department
      const studentsQuery = 'SELECT id, user_id FROM students WHERE department_id = ?';
      const [students] = await pool.execute(studentsQuery, [departmentId]);

      // Get average attendance
      const attendanceQuery = `
        SELECT AVG(attendance_rate) as avg_attendance
        FROM (
          SELECT s.id, (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 as attendance_rate
          FROM students s
          LEFT JOIN attendance a ON s.id = a.student_id
          WHERE s.department_id = ? AND YEAR(a.date) = ? AND a.semester = ?
          GROUP BY s.id
        ) as student_attendance
      `;
      const [attendanceRows] = await pool.execute(attendanceQuery, [departmentId, year, semester]);
      const avgAttendance = attendanceRows[0]?.avg_attendance || 0;

      // Get average GPA
      const gpaQuery = `
        SELECT AVG(gpa) as avg_gpa
        FROM (
          SELECT s.id, AVG(
            CASE
              WHEN g.grade = 'A' THEN 4.0
              WHEN g.grade = 'B+' THEN 3.5
              WHEN g.grade = 'B' THEN 3.0
              WHEN g.grade = 'C+' THEN 2.5
              WHEN g.grade = 'C' THEN 2.0
              WHEN g.grade = 'D' THEN 1.0
              ELSE 0
            END
          ) as gpa
          FROM students s
          LEFT JOIN grades g ON s.id = g.student_id
          WHERE s.department_id = ? AND g.year = ? AND g.semester = ?
          GROUP BY s.id
        ) as student_gpa
      `;
      const [gpaRows] = await pool.execute(gpaQuery, [departmentId, year, semester]);
      const avgGpa = gpaRows[0]?.avg_gpa || 0;

      return {
        department: department.name,
        semester,
        year,
        studentCount: students.length,
        averageAttendance: parseFloat(avgAttendance).toFixed(2),
        averageGpa: parseFloat(avgGpa).toFixed(2)
      };
    } catch (error) {
      throw new Error(`Error generating department report: ${error.message}`);
    }
  }

  // Convert letter grade to GPA points
  static convertGradeToPoint(grade) {
    const gradeMap = {
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'F': 0.0
    };
    return gradeMap[grade] || 0;
  }

  // Export report to PDF (basic implementation)
  static async exportToPDF(reportData, reportType, filePath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Add header
        doc.fontSize(20).text(`SMIS ${reportType} Report`, { align: 'center' });
        doc.moveDown();

        // Add report data based on type
        if (reportType === 'Attendance') {
          doc.fontSize(14).text(`Student ID: ${reportData.studentId}`);
          doc.text(`Period: ${reportData.period.startDate} to ${reportData.period.endDate}`);
          doc.moveDown();

          doc.fontSize(12).text('Summary:');
          doc.text(`Total Days: ${reportData.summary.totalDays}`);
          doc.text(`Present: ${reportData.summary.presentDays}`);
          doc.text(`Absent: ${reportData.summary.absentDays}`);
          doc.text(`Attendance Percentage: ${reportData.summary.attendancePercentage}%`);
          doc.moveDown();

          doc.text('Detailed Records:');
          reportData.records.forEach(record => {
            doc.text(`${record.date}: ${record.status} - ${record.course_name} (${record.first_name} ${record.last_name})`);
          });
        }

        doc.end();
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default ReportService;
