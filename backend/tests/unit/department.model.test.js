import { expect } from 'chai';
import sinon from 'sinon';
import pool from '../../src/config/database.js';
import Department from '../../src/models/department.js';

describe('Department Model Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('create', () => {
    it('should insert and return insertId', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([{ insertId: 77 }]);
      const id = await Department.create({ name: 'Engineering', head_id: 5 });
      expect(id).to.equal(77);
      expect(exec.calledOnce).to.be.true;
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('create fail'));
      try {
        await Department.create({ name: 'X' });
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error creating department');
      }
    });
  });

  describe('findById', () => {
    it('should return Department instance when found', async () => {
      const row = { id: 9, name: 'Science', head_id: 2, created_at: 'x', head_first_name: 'A', head_last_name: 'B' };
      sandbox.stub(pool, 'execute').resolves([[row]]);
      const res = await Department.findById(9);
      expect(res).to.be.instanceOf(Department);
      expect(res.id).to.equal(9);
    });

    it('should return null when not found', async () => {
      sandbox.stub(pool, 'execute').resolves([[]]);
      const res = await Department.findById(999);
      expect(res).to.equal(null);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('find fail'));
      try {
        await Department.findById(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error finding department');
      }
    });
  });

  describe('update', () => {
    it('should return true when affectedRows > 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      const ok = await Department.update(4, { name: 'Updated', head_id: 3 });
      expect(ok).to.equal(true);
    });

    it('should return false when affectedRows = 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 0 }]);
      const ok = await Department.update(4, { name: 'Updated', head_id: 3 });
      expect(ok).to.equal(false);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('upd fail'));
      try {
        await Department.update(1, { name: 'X' });
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error updating department');
      }
    });
  });

  describe('delete', () => {
    it('should return true when affectedRows > 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      const ok = await Department.delete(5);
      expect(ok).to.equal(true);
    });

    it('should return false when affectedRows = 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 0 }]);
      const ok = await Department.delete(5);
      expect(ok).to.equal(false);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('del fail'));
      try {
        await Department.delete(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error deleting department');
      }
    });
  });

  describe('getAll', () => {
    it('should return Department instances', async () => {
      const rows = [
        { id: 1, name: 'A', head_id: null, created_at: 'x' },
        { id: 2, name: 'B', head_id: 3, created_at: 'y' }
      ];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await Department.getAll();
      expect(res).to.be.an('array').with.lengthOf(2);
      expect(res[0]).to.be.instanceOf(Department);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('get fail'));
      try {
        await Department.getAll();
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error getting departments');
      }
    });
  });

  describe('getStats', () => {
    it('should return stats object', async () => {
      const statsRow = { student_count: 10, teacher_count: 4, course_count: 7 };
      sandbox.stub(pool, 'execute').resolves([[statsRow]]);
      const res = await Department.getStats(1);
      expect(res).to.deep.equal(statsRow);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('stats fail'));
      try {
        await Department.getStats(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error getting department stats');
      }
    });
  });
});
