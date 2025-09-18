import chai from 'chai';
import sinon from 'sinon';
import pool from '../../src/config/database.js';
import Timetable from '../../src/models/timetable.js';

const { expect } = chai;

describe('Timetable Model Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createSlot', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.createSlot({});
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to create timetable slot: ${errorMessage}`);
      }
    });
  });

  describe('getTimetableByStudent', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.getTimetableByStudent(1);
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to get student timetable: ${errorMessage}`);
      }
    });

    it('should return timetable data when semester is provided', async () => {
      const mockRows = [{ id: 1, course_id: 1 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.getTimetableByStudent(1, 'Spring 2024');
      expect(result).to.be.an('array');
      expect(result[0]).to.be.instanceOf(Timetable);
    });

    it('should return timetable data when semester is not provided', async () => {
      const mockRows = [{ id: 1, course_id: 1 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.getTimetableByStudent(1);
      expect(result).to.be.an('array');
      expect(result[0]).to.be.instanceOf(Timetable);
    });
  });

  describe('getTimetableByTeacher', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.getTimetableByTeacher(1);
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to get teacher timetable: ${errorMessage}`);
      }
    });

    it('should return timetable data when semester is provided', async () => {
      const mockRows = [{ id: 1, course_id: 1 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.getTimetableByTeacher(1, 'Spring 2024');
      expect(result).to.be.an('array');
      expect(result[0]).to.be.instanceOf(Timetable);
    });

    it('should return timetable data when semester is not provided', async () => {
      const mockRows = [{ id: 1, course_id: 1 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.getTimetableByTeacher(1);
      expect(result).to.be.an('array');
      expect(result[0]).to.be.instanceOf(Timetable);
    });
  });

  describe('checkConflicts', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.checkConflicts(1, 1, 1, '08:00', '09:00', 'Spring 2024');
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to check conflicts: ${errorMessage}`);
      }
    });

    it('should return false when no conflicts and excludeId is provided', async () => {
      const mockRows = [{ conflicts: 0 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.checkConflicts(1, 1, 1, '08:00', '09:00', 'Spring 2024', 1);
      expect(result).to.be.false;
    });

    it('should return true when conflicts exist', async () => {
      const mockRows = [{ conflicts: 1 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.checkConflicts(1, 1, 1, '08:00', '09:00', 'Spring 2024');
      expect(result).to.be.true;
    });
  });

  describe('update', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.update(1, {});
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to update timetable slot: ${errorMessage}`);
      }
    });
  });

  describe('delete', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.delete(1);
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to delete timetable slot: ${errorMessage}`);
      }
    });
  });

  describe('findById', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.findById(1);
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to find timetable slot: ${errorMessage}`);
      }
    });

    it('should return a Timetable instance when found', async () => {
      const mockRows = [{ id: 1, course_id: 1 }];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.findById(1);
      expect(result).to.be.instanceOf(Timetable);
      expect(result.id).to.equal(1);
    });

    it('should return null when not found', async () => {
      const mockRows = [];
      sandbox.stub(pool, 'execute').resolves([mockRows]);

      const result = await Timetable.findById(1);
      expect(result).to.be.null;
    });
  });

  describe('getAllBySemester', () => {
    it('should throw an error if database query fails', async () => {
      const errorMessage = 'Database error';
      sandbox.stub(pool, 'execute').rejects(new Error(errorMessage));

      try {
        await Timetable.getAllBySemester('Spring 2024');
        // Should not reach here
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal(`Failed to get semester timetable: ${errorMessage}`);
      }
    });
  });
});
