import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';
import pool from '../src/config/database.js';
import Teacher from '../src/models/teacher.js';
import sinon from 'sinon';

const { expect } = chai;
chai.use(chaiHttp);

describe('Teacher Model Tests', () => {
  let teacherId;
  let deptId;
  let courseIds = [];

  before(async () => {
    // Create test department
    let [depResults] = await pool.execute('INSERT IGNORE INTO departments (code, name) VALUES (?, ?)', ['TM', 'Test-Department']);
    deptId = depResults.insertId;
    if (deptId === 0) {
      [depResults] = await pool.execute('SELECT id FROM departments WHERE code = ?', ['TM']);
      if (depResults.length > 0) {
        deptId = depResults[0].id;
      }
    }

    // Create test courses
    const courses = [
      { course_code: 'MATH101', name: 'Mathematics 101', description: 'Basic Mathematics', credits: 3, semester: 'Fall' },
      { course_code: 'SCI101', name: 'Science 101', description: 'Basic Science', credits: 3, semester: 'Spring' },
      { course_code: 'ENG101', name: 'English 101', description: 'Basic English', credits: 2, semester: 'Fall' },
      { course_code: 'HIST101', name: 'History 101', description: 'Basic History', credits: 2, semester: 'Spring' }
    ];

    for (const course of courses) {
      try {
        const [result] = await pool.execute(
          'INSERT INTO courses (course_code, name, description, credits, semester, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [course.course_code, course.name, course.description, course.credits, course.semester]
        );
        courseIds.push(result.insertId);
      } catch (error) {
        // Course might already exist, try to get its ID
        try {
          const [existing] = await pool.execute('SELECT id FROM courses WHERE course_code = ?', [course.course_code]);
          if (existing.length > 0) {
            courseIds.push(existing[0].id);
          }
        } catch (innerError) {
          console.log('Could not create or find course:', course.course_code);
        }
      }
    }
  });

  after(async () => {
    // Clean up test data
    if (teacherId) {
      await pool.execute('DELETE FROM users WHERE id = ?', [teacherId]);
    }
    if (deptId) {
        await pool.execute('DELETE FROM departments WHERE id = ?', [deptId]);
    }
  });

  it('should create a new teacher', async () => {
    const teacherData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'johndoe@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: courseIds.slice(0, 2) // Use first 2 course IDs
    };
    teacherId = await Teacher.create(teacherData);
    expect(teacherId).to.be.a('number');
  });

  it('should find a teacher by ID', async () => {
    const teacher = await Teacher.findById(teacherId);
    expect(teacher).to.be.an.instanceOf(Teacher);
    expect(teacher.id).to.equal(teacherId);
  });

  it('should find a teacher by user ID', async () => {
    const teacher = await Teacher.findByUserId(teacherId);
    expect(teacher).to.be.an.instanceOf(Teacher);
    expect(teacher.id).to.equal(teacherId);
  });

  it('should update a teacher', async () => {
    const updateData = {
      department_id: deptId,
      hire_date: '2021-01-01',
      subjects: courseIds.slice(2, 4), // Use last 2 course IDs
      status: 'active'
    };
    const result = await Teacher.update(teacherId, updateData);
    expect(result).to.be.true;
  });

  it('should get all teachers', async () => {
    const teachers = await Teacher.getAll(10, 0);
    expect(teachers).to.be.an('array');
  });

  it('should get all teachers with pagination', async () => {
    const teachers = await Teacher.getAll(5, 0);
    expect(teachers).to.be.an('array');
    expect(teachers.length).to.be.at.most(5);
  });

  it('should get teachers by department', async () => {
    const teachers = await Teacher.getByDepartment(deptId);
    expect(teachers).to.be.an('array');
  });

  it('should delete a teacher', async () => {
    const result = await Teacher.delete(teacherId);
    expect(result).to.be.true;
  });

  it('should return null for non-existent teacher', async () => {
    const teacher = await Teacher.findById(99999);
    expect(teacher).to.be.null;
  });

  it('should handle update with invalid ID', async () => {
    const updateData = {
      department_id: deptId,
      hire_date: '2021-01-01',
      subjects: courseIds.slice(0, 1),
      status: 'active'
    };
    const result = await Teacher.update(99999, updateData);
    expect(result).to.be.false;
  });

  it('should handle delete with invalid ID', async () => {
    const result = await Teacher.delete(99999);
    expect(result).to.be.false;
  });

  it('should get teachers by course (empty result)', async () => {
    const teachers = await Teacher.getByCourse(99999);
    expect(teachers).to.be.an('array');
    expect(teachers).to.have.lengthOf(0);
  });

  it('should handle create with missing required fields', async () => {
    try {
      await Teacher.create({
        first_name: 'Test',
        // missing required fields
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Missing required fields');
    }
  });

  it('should handle getAll with default parameters', async () => {
    const teachers = await Teacher.getAll(10, 0);
    expect(teachers).to.be.an('array');
  });

  it('should handle getByDepartment with invalid department ID', async () => {
    const teachers = await Teacher.getByDepartment(99999);
    expect(teachers).to.be.an('array');
    expect(teachers).to.have.lengthOf(0);
  });

  it('should handle subjects parsing for array format', async () => {
    // Create a teacher with array subjects (course IDs)
    const teacherData = {
      first_name: 'Array',
      last_name: 'Teacher',
      email: 'arrayteacher@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: courseIds.slice(0, 3), // Use first 3 course IDs
      status: 'active'
    };

    const teacherId = await Teacher.create(teacherData);

    try {
      // Test that findById correctly handles array subjects
      const teacher = await Teacher.findById(teacherId);
      expect(teacher).to.be.an.instanceOf(Teacher);
      expect(teacher.subjects).to.be.an('array');
      expect(teacher.subjects).to.have.lengthOf(3);
      // Check that subjects contain course objects with id, course_code, name, etc.
      expect(teacher.subjects[0]).to.have.property('id');
      expect(teacher.subjects[0]).to.have.property('course_code');
      expect(teacher.subjects[0]).to.have.property('name');
    } finally {
      // Clean up
      await pool.execute('DELETE FROM users WHERE id = ?', [teacherId]);
    }
  });

  it('should handle subjects parsing for empty array', async () => {
    // Create a teacher with empty subjects array
    const teacherData = {
      first_name: 'Empty',
      last_name: 'Teacher',
      email: 'emptyteacher@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: [],
      status: 'active'
    };

    const teacherId = await Teacher.create(teacherData);

    try {
      // Test that findById handles empty array subjects
      const teacher = await Teacher.findById(teacherId);
      expect(teacher).to.be.an.instanceOf(Teacher);
      expect(teacher.subjects).to.be.an('array');
      expect(teacher.subjects).to.deep.equal([]);
    } finally {
      // Clean up
      await pool.execute('DELETE FROM users WHERE id = ?', [teacherId]);
    }
  });

  it('should handle getAll with large limit (capped at 100)', async () => {
    const teachers = await Teacher.getAll(200, 0); // Try to get 200, should be capped at 100
    expect(teachers).to.be.an('array');
    expect(teachers.length).to.be.at.most(100);
  });

  it('should handle getAll with string parameters', async () => {
    const teachers = await Teacher.getAll('5', '0'); // String parameters
    expect(teachers).to.be.an('array');
    expect(teachers.length).to.be.at.most(5);
  });

  it('should validate subjects when creating teacher with invalid course IDs', async () => {
    try {
      const teacherData = {
        first_name: 'Invalid',
        last_name: 'Teacher',
        email: 'invalid@example.com',
        password_hash: 'password123',
        department_id: deptId,
        hire_date: '2020-01-01',
        subjects: [99999, 99998] // Invalid course IDs
      };
      await Teacher.create(teacherData);
      expect.fail('Should have thrown an error for invalid course IDs');
    } catch (error) {
      expect(error.message).to.include('Invalid course IDs');
    }
  });

  it('should create teacher with empty subjects array', async () => {
    const teacherData = {
      first_name: 'Empty',
      last_name: 'Subjects',
      email: 'empty@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: []
    };
    const teacherId = await Teacher.create(teacherData);
    expect(teacherId).to.be.a('number');

    // Clean up
    await pool.execute('DELETE FROM users WHERE id = ?', [teacherId]);
  });

  it('should handle subjects parsing for course IDs (backward compatibility)', async () => {
    // Insert a teacher with course IDs as subjects directly in DB
    const subjectIds = JSON.stringify(courseIds.slice(0, 3)); // Use first 3 course IDs
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      ['Legacy', 'Teacher', 'legacy@example.com', 'password123', 'teacher', deptId, '2020-01-01', subjectIds, 'active']
    );
    const teacherId = result.insertId;

    try {
      const teacher = await Teacher.findById(teacherId);
      expect(teacher).to.be.an.instanceOf(Teacher);
      expect(teacher.subjects).to.be.an('array');
      expect(teacher.subjects).to.have.lengthOf(3);
      // Check that subjects contain course objects
      expect(teacher.subjects[0]).to.have.property('id');
      expect(teacher.subjects[0]).to.have.property('course_code');
    } finally {
      // Clean up
      await pool.execute('DELETE FROM users WHERE id = ?', [teacherId]);
    }
  });

  it('should handle getAll with null/undefined parameters', async () => {
    const teachers = await Teacher.getAll(null, undefined);
    expect(teachers).to.be.an('array');
  });

  it('should handle getAll with negative parameters', async () => {
    const teachers = await Teacher.getAll(-5, -10);
    expect(teachers).to.be.an('array');
    expect(teachers.length).to.be.at.most(10); // Should default to 10
  });

  it('should create a teacher without subjects property (undefined) and default to empty array', async () => {
    const teacherData = {
      first_name: 'NoSub',
      last_name: 'Teacher',
      email: 'nosubjects@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01'
      // subjects intentionally omitted
    };
    const newId = await Teacher.create(teacherData);
    try {
      const teacher = await Teacher.findById(newId);
      expect(teacher).to.be.an.instanceOf(Teacher);
      expect(teacher.subjects).to.be.an('array');
      expect(teacher.subjects).to.deep.equal([]);
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should parse comma-separated subjects string in findById without fetching course details', async () => {
    // Insert a teacher with subjects stored as a JSON string (e.g., "1,2,3") to simulate legacy comma-separated format
    const [result] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, JSON_QUOTE(?), ?, NOW(), NOW())",
      ['Comma', 'FindById', 'commasep1@example.com', 'password123', 'teacher', deptId, '2020-01-01', '1,2,3', 'active']
    );
    const newId = result.insertId;
    try {
      const teacher = await Teacher.findById(newId);
      expect(teacher).to.be.an.instanceOf(Teacher);
      expect(teacher.subjects).to.be.an('array');
      // Convert any quoted elements into plain values
      const cleaned = teacher.subjects.map(s => (typeof s === 'string' ? s.replace(/"/g, '').trim() : s));
      expect(cleaned).to.deep.equal(['1', '2', '3']);
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should parse comma-separated subjects string in getAll results', async () => {
    const [result] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, JSON_QUOTE(?), ?, NOW(), NOW())",
      ['Comma', 'GetAll', 'commasep2@example.com', 'password123', 'teacher', deptId, '2020-01-01', '4,5', 'active']
    );
    const newId = result.insertId;
    try {
      const teachers = await Teacher.getAll(50, 0);
      const found = teachers.find(t => t.id === newId);
      expect(found).to.exist;
      expect(found.subjects).to.be.an('array');
      const cleaned = found.subjects.map(s => (typeof s === 'string' ? s.replace(/"/g, '').trim() : s));
      expect(cleaned).to.deep.equal(['4', '5']);
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should parse comma-separated subjects string in getByDepartment results', async () => {
    const [result] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, JSON_QUOTE(?), ?, NOW(), NOW())",
      ['Comma', 'ByDept', 'commasep3@example.com', 'password123', 'teacher', deptId, '2020-01-01', '6,7,8', 'active']
    );
    const newId = result.insertId;
    try {
      const teachers = await Teacher.getByDepartment(deptId);
      const found = teachers.find(t => t.id === newId);
      expect(found).to.exist;
      expect(found.subjects).to.be.an('array');
      const cleaned = found.subjects.map(s => (typeof s === 'string' ? s.replace(/"/g, '').trim() : s));
      expect(cleaned).to.deep.equal(['6', '7', '8']);
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should update with null hire_date and undefined subjects (subjects reset to empty array)', async () => {
    // Start with a teacher that has subjects set
    const initialData = {
      first_name: 'Update',
      last_name: 'UndefinedSubjects',
      email: 'updatesubjects@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: [/* using empty will be set, but we want non-empty to verify reset */]
    };
    // Ensure at least one valid subject to begin with: use an existing course id if available
    // Fall back to using stringified JSON if no course ids found earlier
    // We'll just create with empty subjects as create validates IDs; then manually set subjects to JSON string "[1]"
    const createdId = await Teacher.create({ ...initialData, subjects: [] });
    try {
      // Manually set subjects to simulate previously set non-empty value
      await pool.execute('UPDATE users SET subjects = ? WHERE id = ?', ['[1]', createdId]);

      // Update without subjects field; hire_date set to NULL
      const result = await Teacher.update(createdId, { department_id: deptId, hire_date: null, status: 'active' });
      expect(result).to.be.true;

      const teacher = await Teacher.findById(createdId);
      expect(teacher).to.be.an.instanceOf(Teacher);
      expect(teacher.subjects).to.be.an('array');
      expect(teacher.subjects).to.deep.equal([]);
      // hire_date should be null in DB; depending on driver it may return null
      expect(teacher.hire_date === null || teacher.hire_date === undefined).to.be.true;
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [createdId]);
    }
  });

  it('should wrap DB error on create with duplicate email', async () => {
    const teacherData = {
      first_name: 'Dup',
      last_name: 'Email',
      email: 'dup-teacher@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: []
    };
    const firstId = await Teacher.create(teacherData);
    try {
      try {
        await Teacher.create(teacherData);
        expect.fail('Expected duplicate email error to be thrown');
      } catch (error) {
        expect(error.message).to.include('Error creating teacher');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [firstId]);
    }
  });

  it('should wrap DB error on update with invalid status enum', async () => {
    const baseData = {
      first_name: 'Invalid',
      last_name: 'Status',
      email: 'invalid-status@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: []
    };
    const id = await Teacher.create(baseData);
    try {
      try {
        await Teacher.update(id, {
          department_id: deptId,
          hire_date: '2021-01-01',
          subjects: [],
          status: 'not-a-valid-status' // invalid ENUM
        });
        expect.fail('Expected invalid enum error');
      } catch (error) {
        expect(error.message).to.include('Error updating teacher');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
  });

  it('should wrap JSON parse error in findById when subjects is invalid JSON starting with "["', async () => {
    const [insert] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'teacher', ?, ?, JSON_QUOTE(?), 'active', NOW(), NOW())",
      ['Bad', 'JsonFind', 'badjson-find@example.com', 'password123', deptId, '2020-01-01', '[1,2'] // invalid JSON (trailing comma / missing bracket)
    );
    const newId = insert.insertId;
    try {
      try {
        await Teacher.findById(newId);
        expect.fail('Expected JSON parse error to be wrapped');
      } catch (error) {
        expect(error.message).to.include('Error finding teacher');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should wrap JSON parse error in getAll when a row has invalid JSON subjects starting with "["', async () => {
    const [insert] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'teacher', ?, ?, JSON_QUOTE(?), 'active', NOW(), NOW())",
      ['Bad', 'JsonAll', 'badjson-all@example.com', 'password123', deptId, '2020-01-01', '["'] // invalid JSON
    );
    const newId = insert.insertId;
    try {
      try {
        await Teacher.getAll(10, 0);
        expect.fail('Expected JSON parse error to be wrapped');
      } catch (error) {
        expect(error.message).to.include('Error getting teachers');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should wrap JSON parse error in getByDepartment when a row has invalid JSON subjects starting with "["', async () => {
    const [insert] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'teacher', ?, ?, JSON_QUOTE(?), 'active', NOW(), NOW())",
      ['Bad', 'JsonDept', 'badjson-dept@example.com', 'password123', deptId, '2020-01-01', '["'] // invalid JSON
    );
    const newId = insert.insertId;
    try {
      try {
        await Teacher.getByDepartment(deptId);
        expect.fail('Expected JSON parse error to be wrapped');
      } catch (error) {
        expect(error.message).to.include('Error getting teachers by department');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should wrap DB error on create with duplicate email', async () => {
    const teacherData = {
      first_name: 'Dup',
      last_name: 'Email',
      email: 'dup-teacher@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: []
    };
    const firstId = await Teacher.create(teacherData);
    try {
      try {
        await Teacher.create(teacherData);
        expect.fail('Expected duplicate email error to be thrown');
      } catch (error) {
        expect(error.message).to.include('Error creating teacher');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [firstId]);
    }
  });

  it('should wrap DB error on update with invalid status enum', async () => {
    const baseData = {
      first_name: 'Invalid',
      last_name: 'Status',
      email: 'invalid-status@example.com',
      password_hash: 'password123',
      department_id: deptId,
      hire_date: '2020-01-01',
      subjects: []
    };
    const id = await Teacher.create(baseData);
    try {
      try {
        await Teacher.update(id, {
          department_id: deptId,
          hire_date: '2021-01-01',
          subjects: [],
          status: 'not-a-valid-status' // invalid ENUM
        });
        expect.fail('Expected invalid enum error');
      } catch (error) {
        expect(error.message).to.include('Error updating teacher');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
  });

  it('should wrap JSON parse error in findById when subjects is invalid JSON starting with "["', async () => {
    const [insert] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'teacher', ?, ?, JSON_QUOTE(?), 'active', NOW(), NOW())",
      ['Bad', 'JsonFind', 'badjson-find@example.com', 'password123', deptId, '2020-01-01', '[1,2'] // invalid JSON (trailing comma / missing bracket)
    );
    const newId = insert.insertId;
    try {
      try {
        await Teacher.findById(newId);
        expect.fail('Expected JSON parse error to be wrapped');
      } catch (error) {
        expect(error.message).to.include('Error finding teacher');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should wrap JSON parse error in getAll when a row has invalid JSON subjects starting with "["', async () => {
    const [insert] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'teacher', ?, ?, JSON_QUOTE(?), 'active', NOW(), NOW())",
      ['Bad', 'JsonAll', 'badjson-all@example.com', 'password123', deptId, '2020-01-01', '["'] // invalid JSON
    );
    const newId = insert.insertId;
    try {
      try {
        await Teacher.getAll(10, 0);
        expect.fail('Expected JSON parse error to be wrapped');
      } catch (error) {
        expect(error.message).to.include('Error getting teachers');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should wrap JSON parse error in getByDepartment when a row has invalid JSON subjects starting with "["', async () => {
    const [insert] = await pool.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, hire_date, subjects, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'teacher', ?, ?, JSON_QUOTE(?), 'active', NOW(), NOW())",
      ['Bad', 'JsonDept', 'badjson-dept@example.com', 'password123', deptId, '2020-01-01', '["'] // invalid JSON
    );
    const newId = insert.insertId;
    try {
      try {
        await Teacher.getByDepartment(deptId);
        expect.fail('Expected JSON parse error to be wrapped');
      } catch (error) {
        expect(error.message).to.include('Error getting teachers by department');
      }
    } finally {
      await pool.execute('DELETE FROM users WHERE id = ?', [newId]);
    }
  });

  it('should get teachers by course (positive path) and parse comma-separated subjects in mapping', async () => {
    // stub pool.execute to return one teacher row for getByCourse
    const stub = sinon.stub(pool, 'execute').resolves([[
      {
        id: 99991,
        first_name: 'ByCourse',
        last_name: 'Teacher',
        email: 'bycourse@example.com',
        password_hash: 'password123',
        role: 'teacher',
        department_id: deptId,
        hire_date: '2020-01-01',
        subjects: '9,10',
        status: 'active'
      }
    ]]);
    try {
      const result = await Teacher.getByCourse(12345);
      expect(result).to.be.an('array');
      expect(result.length).to.equal(1);
      expect(result[0]).to.be.instanceOf(Teacher);
      expect(result[0].subjects).to.deep.equal(['9', '10']);
    } finally {
      stub.restore();
    }
  });

  it('should wrap DB error in getByCourse', async () => {
    const stub = sinon.stub(pool, 'execute').rejects(new Error('DB error'));
    try {
      try {
        await Teacher.getByCourse(12345);
        expect.fail('Expected DB error in getByCourse');
      } catch (error) {
        expect(error.message).to.include('Error getting teachers by course');
      }
    } finally {
      stub.restore();
    }
  });

  it('should wrap DB error in delete', async () => {
    const stub = sinon.stub(pool, 'execute').rejects(new Error('DB error'));
    try {
      try {
        await Teacher.delete(1);
        expect.fail('Expected DB error in delete');
      } catch (error) {
        expect(error.message).to.include('Error deleting teacher');
      }
    } finally {
      stub.restore();
    }
  });
});
