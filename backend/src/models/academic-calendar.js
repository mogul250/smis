import pool from '../config/database.js';

class AcademicCalendar {
  // Create a new calendar event
  static async create(eventData) {
    const { event_name, event_date, event_type, description, academic_year } = eventData;

    const query = `
      INSERT INTO academic_calendar (event_name, event_date, event_type, description, academic_year)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [event_name, event_date, event_type, description, academic_year]);
    return result.insertId;
  }

  // Find event by ID
  static async findById(id) {
    const query = 'SELECT * FROM academic_calendar WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  // Get all events
  static async getAll() {
    const query = 'SELECT * FROM academic_calendar ORDER BY event_date ASC';
    const [rows] = await pool.execute(query);
    return rows;
  }

  // Get events by month and year
  static async getEventsByMonth(year, month) {
    const query = `
      SELECT * FROM academic_calendar
      WHERE YEAR(event_date) = ? AND MONTH(event_date) = ?
      ORDER BY event_date ASC
    `;
    const [rows] = await pool.execute(query, [year, month]);
    return rows;
  }

  // Get events by academic year
  static async getEventsByYear(academicYear) {
    const query = `
      SELECT * FROM academic_calendar
      WHERE academic_year = ?
      ORDER BY event_date ASC
    `;
    const [rows] = await pool.execute(query, [academicYear]);
    return rows;
  }

  // Get upcoming events
  static async getUpcomingEvents(limit = 10) {
    const query = `
      SELECT * FROM academic_calendar
      WHERE event_date >= CURDATE()
      ORDER BY event_date ASC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [limit]);
    return rows;
  }

  // Update event
  static async update(id, updateData) {
    const { event_name, event_date, event_type, description, academic_year } = updateData;

    const query = `
      UPDATE academic_calendar
      SET event_name = ?, event_date = ?, event_type = ?, description = ?, academic_year = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [event_name, event_date, event_type, description, academic_year, id]);
    return result.affectedRows > 0;
  }

  // Delete event
  static async delete(id) {
    const query = 'DELETE FROM academic_calendar WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get events by type
  static async getEventsByType(eventType) {
    const query = `
      SELECT * FROM academic_calendar
      WHERE event_type = ?
      ORDER BY event_date ASC
    `;
    const [rows] = await pool.execute(query, [eventType]);
    return rows;
  }

  // Get semester start and end dates
  static async getSemesterDates(academicYear, semester) {
    const query = `
      SELECT * FROM academic_calendar
      WHERE academic_year = ? AND event_type = 'semester_start' AND description LIKE ?
      ORDER BY event_date ASC
    `;
    const [startRows] = await pool.execute(query, [academicYear, `%${semester}%`]);

    const endQuery = `
      SELECT * FROM academic_calendar
      WHERE academic_year = ? AND event_type = 'semester_end' AND description LIKE ?
      ORDER BY event_date ASC
    `;
    const [endRows] = await pool.execute(endQuery, [academicYear, `%${semester}%`]);

    return {
      start: startRows[0] || null,
      end: endRows[0] || null
    };
  }
}

export default AcademicCalendar;
