import pool from '../config/database.js';

class Timetable {
  constructor(data) {
    this.id = data.id;
    this.course_id = data.course_id;
    this.teacher_id = data.teacher_id;
    this.day_of_week = data.day_of_week;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.class_id = data.class_id;
    this.semester = data.semester;
    this.academic_year = data.academic_year;
  }

  // Create a new timetable slot
  static async createSlot(slotData) {
    const { course_id, teacher_id, day_of_week, start_time, end_time, class_id, semester } = slotData;
    const query = `
      INSERT INTO timetable (course_id, teacher_id, day_of_week, start_time, end_time, class_id, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await pool.execute(query, [course_id, teacher_id, day_of_week, start_time, end_time, class_id, semester]);
      return result.insertId;
    } catch (error) {
      throw new Error('Failed to create timetable slot: ' + error.message);
    }
  }

  // Get timetable for a specific student based on their course enrollments
  static async getTimetableByStudent(studentId, semester = null) {
    console.log('=== Getting Timetable for Student ===');
    console.log('Student ID:', studentId);
    console.log('Semester:', semester);
    
    try {
      // First, check if the student exists
      const [student] = await pool.execute('SELECT id FROM students WHERE id = ?', [studentId]);
      if (student.length === 0) {
        console.log('Student not found');
        return [];
      }

      // Get the current semester if not provided
      if (!semester || semester === 'current') {
        const [currentSemester] = await pool.execute(
          'SELECT semester FROM academic_calendar WHERE start_date <= CURDATE() AND end_date >= CURDATE() AND event_type = "semester" LIMIT 1'
        );
        semester = currentSemester.length > 0 ? currentSemester[0].semester : 'Fall'; // Default to Fall if no current semester found
      }

      // Get the academic year
      const [academicYear] = await pool.execute(
        'SELECT academic_year FROM classes WHERE academic_year IS NOT NULL LIMIT 1'
      );
      const academicYearStr = academicYear.length > 0 ? academicYear[0].academic_year : '2024-2025';

      // Get the timetable entries
      const [timetable] = await pool.execute(
        `SELECT 
          t.id,
          t.day_of_week,
          t.start_time,
          t.end_time,
          t.semester,
          t.academic_year,
          c.id as course_id,
          c.course_code,
          c.name as course_name,
          c.credits,
          CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
          cl.name as class_name,
          'Room TBA' as room
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        LEFT JOIN users u ON t.teacher_id = u.id
        LEFT JOIN classes cl ON t.class_id = cl.id
        JOIN course_enrollments ce ON ce.course_id = c.id
        WHERE ce.student_id = ? 
          AND (t.semester = ? OR ? IS NULL)
          AND (t.academic_year = ? OR ? IS NULL)
          AND ce.status = 'enrolled'
        ORDER BY t.day_of_week, t.start_time`,
        [studentId, semester, semester, academicYearStr, academicYearStr]
      );

      console.log(`Found ${timetable.length} timetable entries for student ${studentId}`);
      return timetable;
      
    } catch (error) {
      console.error('Error in getTimetableByStudent:', error);
      return [];
    }
  }
  
  // Helper method to return consistent sample data
  static getSampleTimetableData() {
    return [
      {
        id: 1,
        day_of_week: 1, // Monday
        start_time: '09:00:00',
        end_time: '10:30:00',
        course_name: 'Introduction to Computer Science',
        course_code: 'CS101',
        teacher_name: 'Dr. John Smith',
        room: 'Room 101',
        semester: 'current'
      },
      {
        id: 2,
        day_of_week: 1, // Monday
        start_time: '11:00:00',
        end_time: '12:30:00',
        course_name: 'Calculus I',
        course_code: 'MATH101',
        teacher_name: 'Prof. Jane Doe',
        room: 'Room 201',
        semester: 'current'
      },
      {
        id: 3,
        day_of_week: 3, // Wednesday
        start_time: '14:00:00',
        end_time: '15:30:00',
        course_name: 'English Composition',
        course_code: 'ENG101',
        teacher_name: 'Dr. Sarah Wilson',
        room: 'Room 301',
        semester: 'current'
      },
      {
        id: 4,
        day_of_week: 5, // Friday
        start_time: '10:00:00',
        end_time: '11:30:00',
        course_name: 'Physics I',
        course_code: 'PHY101',
        teacher_name: 'Prof. Michael Brown',
        room: 'Lab 1',
        semester: 'current'
      }
    ];
  }

  // Get timetable for a specific teacher
  static async getTimetableByTeacher(teacherId, semester = null) {
    let query = `
      SELECT t.*,
        JSON_OBJECT('id', c.id, 'name', c.name) AS course,
        JSON_OBJECT('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS teacher,
        JSON_OBJECT('id', cl.id, 'name', cl.name) AS class
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN classes cl ON t.class_id = cl.id
      WHERE t.teacher_id = ?
    `;
    const params = [teacherId];

    if (semester) {
      query += ' AND t.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY t.day_of_week, t.start_time';

    try {
      const [rows] = await pool.execute(query, params);
      return rows; // Return full joined row objects
    } catch (error) {
      throw new Error('Failed to get teacher timetable: ' + error.message);
    }
  }

  // Check for conflicts in timetable
  static async checkConflicts(courseId, teacherId, day_of_week, startTime, endTime, semester, excludeId = null) {
    let query = `
      SELECT id FROM timetable
      WHERE semester = ? AND day_of_week = ? AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      ) AND (course_id = ? OR teacher_id = ?)
    `;
    const params = [semester, day_of_week, endTime, startTime, startTime, endTime, startTime, endTime, courseId, teacherId];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const [rows] = await pool.execute(query, params);
      // Return array of conflicting slot IDs
      return rows.map(row => row.id);
    } catch (error) {
      throw new Error('Failed to check conflicts: ' + error.message);
    }
  }

  // Update a timetable slot
  static async update(slotId, updateData) {
    if (!updateData || Object.keys(updateData).length === 0) return false;
    const allowedFields = ['course_id', 'teacher_id', 'day', 'start_time', 'end_time', 'room', 'semester','day_of_week'];
    const setClauses = [];
    const values = [];
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    // setClauses.push('updated_at = NOW()');
    const query = `UPDATE timetable SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(slotId);
    try {
      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update timetable slot: ' + error);
    }
  }

  // Delete a timetable slot
  static async delete(slotId) {
    const query = 'DELETE FROM timetable WHERE id = ?';
    try {
      const [result] = await pool.execute(query, [slotId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to delete timetable slot: ' + error.message);
    }
  }

  // Find slot by ID
  static async findById(id) {
    const query = 'SELECT * FROM timetable WHERE id = ?';
    try {
      const [rows] = await pool.execute(query, [id]);
      return rows.length > 0 ? new Timetable(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to find timetable slot: ' + error.message);
    }
  }

  // Get all timetable slots for a semester
  static async getAllBySemester(semester) {
    const query = `
      SELECT t.*,
        JSON_OBJECT('id', c.id, 'name', c.name) AS course,
        JSON_OBJECT('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS teacher,
        JSON_OBJECT('id', cl.id, 'name', cl.name) AS class
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON t.teacher_id = u.id
      JOIN classes cl ON t.class_id = cl.id
      WHERE t.semester = ?
      ORDER BY t.day_of_week, t.start_time
    `;
    try {
      const [rows] = await pool.execute(query, [semester]);
      return rows; // Return full joined row objects
    } catch (error) {
      throw new Error('Failed to get semester timetable: ' + error.message);
    }
  }
}

export default Timetable;
