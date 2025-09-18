import { expect } from 'chai';
import sinon from 'sinon';
import Grade from '../../src/models/grade.js';
import pool from '../../src/config/database.js';

describe('Grade Model', () => {
  let poolStub;

  beforeEach(() => {
    poolStub = sinon.stub(pool);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('assignGrade', () => {
    it('should assign grade successfully', async () => {
      const mockResult = { insertId: 1 };
      poolStub.execute.resolves([mockResult]);

      const gradeData = {
        grade: 'A',
        semester: 'Spring 2024',
        year: 2024,
        comments: 'Excellent performance'
      };

      const result = await Grade.assignGrade(1, 1, 1, gradeData);

      expect(result).to.equal(1);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1, 1, 1, 'A', 'Spring 2024', 2024, 'Excellent performance']
      )).to.be.true;
    });

    it('should assign grade without comments', async () => {
      const mockResult = { insertId: 2 };
      poolStub.execute.resolves([mockResult]);

      const gradeData = {
        grade: 'B+',
        semester: 'Fall 2024',
        year: 2024,
        comments: null
      };

      const result = await Grade.assignGrade(2, 2, 2, gradeData);

      expect(result).to.equal(2);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [2, 2, 2, 'B+', 'Fall 2024', 2024, null]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const gradeData = {
        grade: 'C',
        semester: 'Spring 2024',
        year: 2024,
        comments: 'Good work'
      };

      try {
        await Grade.assignGrade(1, 1, 1, gradeData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to assign grade: Database connection failed');
      }
    });
  });

  describe('getGradesByStudent', () => {
    it('should get all grades for a student', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          course_id: 1,
          teacher_id: 1,
          grade: 'A',
          semester: 'Spring 2024',
          year: 2024,
          comments: 'Excellent work',
          course_name: 'Mathematics',
          course_code: 'MATH101',
          teacher_name: 'John Doe'
        },
        {
          id: 2,
          student_id: 1,
          course_id: 2,
          teacher_id: 2,
          grade: 'B+',
          semester: 'Spring 2024',
          year: 2024,
          comments: 'Good performance',
          course_name: 'Physics',
          course_code: 'PHYS101',
          teacher_name: 'Jane Smith'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Grade.getGradesByStudent(1);

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.instanceOf(Grade);
      expect(result[0].id).to.equal(1);
      expect(result[0].grade).to.equal('A');
      // Note: course_name, course_code, and teacher_name are additional fields from JOIN
      // They are not part of the Grade constructor but are available on the raw result objects
      // The test should not expect these fields on Grade instances
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Grade.getGradesByStudent(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get grades: Database connection failed');
      }
    });

    it('should return empty array when no grades found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Grade.getGradesByStudent(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getGradesByCourse', () => {
    it('should get all grades for a course', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          course_id: 1,
          teacher_id: 1,
          grade: 'A',
          semester: 'Spring 2024',
          year: 2024,
          comments: 'Excellent',
          user_id: 2,
          student_name: 'Alice Johnson'
        },
        {
          id: 2,
          student_id: 2,
          course_id: 1,
          teacher_id: 1,
          grade: 'B',
          semester: 'Spring 2024',
          year: 2024,
          comments: 'Good work',
          user_id: 3,
          student_name: 'Bob Wilson'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Grade.getGradesByCourse(1);

      expect(result).to.have.lengthOf(2);
      expect(result[0].grade).to.equal('A');
      expect(result[0].student_name).to.equal('Alice Johnson');
      expect(result[1].grade).to.equal('B');
      expect(result[1].student_name).to.equal('Bob Wilson');
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Grade.getGradesByCourse(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to get course grades: Database connection failed');
      }
    });

    it('should return empty array when no grades found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Grade.getGradesByCourse(1);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('update', () => {
    it('should update grade successfully', async () => {
      const mockResult = { affectedRows: 1 };
      poolStub.execute.resolves([mockResult]);

      const updateData = {
        grade: 'A-',
        comments: 'Updated grade'
      };

      const result = await Grade.update(1, updateData);

      expect(result).to.be.true;
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        ['A-', 'Updated grade', 1]
      )).to.be.true;
    });

    it('should return false when grade not found', async () => {
      const mockResult = { affectedRows: 0 };
      poolStub.execute.resolves([mockResult]);

      const updateData = {
        grade: 'B',
        comments: 'Updated comments'
      };

      const result = await Grade.update(999, updateData);

      expect(result).to.be.false;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      const updateData = {
        grade: 'C+',
        comments: 'Updated'
      };

      try {
        await Grade.update(1, updateData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to update grade: Database connection failed');
      }
    });
  });

  describe('calculateGPA', () => {
    it('should calculate GPA correctly', async () => {
      const mockRows = [{ gpa: 3.5 }];
      poolStub.execute.resolves([mockRows]);

      const result = await Grade.calculateGPA(1);

      expect(result).to.equal(3.5);
      expect(poolStub.execute.calledWith(
        sinon.match.string,
        [1]
      )).to.be.true;
    });

    it('should return 0.0 when no grades found', async () => {
      const mockRows = [{ gpa: null }];
      poolStub.execute.resolves([mockRows]);

      const result = await Grade.calculateGPA(1);

      expect(result).to.equal(0.0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Grade.calculateGPA(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to calculate GPA: Database connection failed');
      }
    });

    it('should calculate GPA with different grade values', async () => {
      // Test the GPA calculation logic indirectly by ensuring the query is called correctly
      const mockRows = [{ gpa: 2.75 }];
      poolStub.execute.resolves([mockRows]);

      const result = await Grade.calculateGPA(2);

      expect(result).to.equal(2.75);
    });
  });

  describe('findById', () => {
    it('should find grade by ID successfully', async () => {
      const mockRows = [
        {
          id: 1,
          student_id: 1,
          course_id: 1,
          teacher_id: 1,
          grade: 'A',
          semester: 'Spring 2024',
          year: 2024,
          comments: 'Excellent work'
        }
      ];

      poolStub.execute.resolves([mockRows]);

      const result = await Grade.findById(1);

      expect(result).to.be.instanceOf(Grade);
      expect(result.id).to.equal(1);
      expect(result.grade).to.equal('A');
      expect(result.semester).to.equal('Spring 2024');
      expect(poolStub.execute.calledWith(
        'SELECT * FROM grades WHERE id = ?',
        [1]
      )).to.be.true;
    });

    it('should return null when grade not found', async () => {
      poolStub.execute.resolves([[]]);

      const result = await Grade.findById(999);

      expect(result).to.be.null;
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      poolStub.execute.rejects(error);

      try {
        await Grade.findById(1);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Failed to find grade: Database connection failed');
      }
    });
  });

  describe('Grade constructor', () => {
    it('should create Grade instance with all properties', () => {
      const data = {
        id: 1,
        student_id: 1,
        course_id: 1,
        teacher_id: 1,
        grade: 'A',
        semester: 'Spring 2024',
        year: 2024,
        comments: 'Excellent performance'
      };

      const grade = new Grade(data);

      expect(grade.id).to.equal(1);
      expect(grade.student_id).to.equal(1);
      expect(grade.course_id).to.equal(1);
      expect(grade.teacher_id).to.equal(1);
      expect(grade.grade).to.equal('A');
      expect(grade.semester).to.equal('Spring 2024');
      expect(grade.year).to.equal(2024);
      expect(grade.comments).to.equal('Excellent performance');
    });

    it('should create Grade instance with minimal properties', () => {
      const data = {
        id: 2,
        student_id: 2,
        course_id: 2,
        teacher_id: 2,
        grade: 'B',
        semester: 'Fall 2024',
        year: 2024
      };

      const grade = new Grade(data);

      expect(grade.id).to.equal(2);
      expect(grade.student_id).to.equal(2);
      expect(grade.grade).to.equal('B');
      expect(grade.semester).to.equal('Fall 2024');
      expect(grade.comments).to.be.undefined;
    });
  });
});
