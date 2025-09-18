import { expect } from 'chai';
import sinon from 'sinon';
import pool from '../../src/config/database.js';
import AcademicCalendar from '../../src/models/academic-calendar.js';

describe('AcademicCalendar Model Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('create', () => {
    it('should insert an event and return insertId', async () => {
      const exec = sandbox.stub(pool, 'execute').resolves([{ insertId: 42 }]);
      const id = await AcademicCalendar.create({
        event_name: 'Holiday',
        event_type: 'holiday',
        event_date: '2024-12-25',
        description: 'Xmas',
        is_recurring: false
      });
      expect(id).to.equal(42);
      expect(exec.calledOnce).to.be.true;
    });

    it('should propagate DB errors', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('db error'));
      try {
        await AcademicCalendar.create({
          event_name: 'X',
          event_type: 'holiday',
          event_date: '2024-01-01'
        });
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('db error');
      }
    });
  });

  describe('findById', () => {
    it('should return null when no rows', async () => {
      sandbox.stub(pool, 'execute').resolves([[]]);
      const row = await AcademicCalendar.findById(1);
      expect(row).to.equal(null);
    });

    it('should return first row', async () => {
      const data = { id: 1, event_name: 'A', event_type: 'holiday', start_date: '2024-01-01' };
      sandbox.stub(pool, 'execute').resolves([[data]]);
      const row = await AcademicCalendar.findById(1);
      expect(row).to.deep.equal(data);
    });
  });

  describe('getAll', () => {
    it('should return rows', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await AcademicCalendar.getAll();
      expect(res).to.deep.equal(rows);
    });

    it('should propagate error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('db fail'));
      try {
        await AcademicCalendar.getAll();
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('db fail');
      }
    });
  });

  describe('getEventsByMonth', () => {
    it('should return rows for given year/month', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await AcademicCalendar.getEventsByMonth(2024, 5);
      expect(res).to.deep.equal(rows);
    });
  });

  describe('getEventsByYear', () => {
    it('should return rows for given academic year', async () => {
      const rows = [{ id: 1 }];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await AcademicCalendar.getEventsByYear('2024-2025');
      expect(res).to.deep.equal(rows);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should pass default limit and return rows', async () => {
      const rows = [{ id: 1 }];
      const exec = sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await AcademicCalendar.getUpcomingEvents();
      expect(res).to.deep.equal(rows);
      expect(exec.calledOnce).to.be.true;
      const args = exec.getCall(0).args[1];
      expect(args).to.deep.equal([10]);
    });

    it('should accept custom limit', async () => {
      const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const exec = sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await AcademicCalendar.getUpcomingEvents(3);
      expect(res).to.deep.equal(rows);
      const args = exec.getCall(0).args[1];
      expect(args).to.deep.equal([3]);
    });
  });

  describe('update', () => {
    it('should return true when affectedRows > 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      const ok = await AcademicCalendar.update(5, {
        event_name: 'X',
        event_type: 'holiday',
        event_date: '2024-01-01',
        description: 'Desc',
        is_recurring: true
      });
      expect(ok).to.equal(true);
    });

    it('should return false when affectedRows = 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 0 }]);
      const ok = await AcademicCalendar.update(999, {
        event_name: 'Y',
        event_type: 'holiday',
        event_date: '2024-01-01'
      });
      expect(ok).to.equal(false);
    });

    it('should propagate error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('upd fail'));
      try {
        await AcademicCalendar.update(1, { event_name: 'Z', event_type: 'exam', event_date: '2024-02-02' });
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('upd fail');
      }
    });
  });

  describe('delete', () => {
    it('should return true when affectedRows > 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      const ok = await AcademicCalendar.delete(7);
      expect(ok).to.equal(true);
    });

    it('should return false when affectedRows = 0', async () => {
      sandbox.stub(pool, 'execute').resolves([{ affectedRows: 0 }]);
      const ok = await AcademicCalendar.delete(777);
      expect(ok).to.equal(false);
    });

    it('should propagate error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('del fail'));
      try {
        await AcademicCalendar.delete(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('del fail');
      }
    });
  });

  describe('getEventsByType', () => {
    it('should return rows by type', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await AcademicCalendar.getEventsByType('holiday');
      expect(res).to.deep.equal(rows);
    });
  });

  describe('getSemesterDates', () => {
    it('should return start and end objects', async () => {
      const exec = sandbox.stub(pool, 'execute');
      exec.onCall(0).resolves([[{ id: 1, event_type: 'semester_start' }]]);
      exec.onCall(1).resolves([[{ id: 2, event_type: 'semester_end' }]]);
      const res = await AcademicCalendar.getSemesterDates('2024-2025', 'Fall');
      expect(exec.callCount).to.equal(2);
      expect(res).to.deep.equal({
        start: { id: 1, event_type: 'semester_start' },
        end: { id: 2, event_type: 'semester_end' }
      });
    });

    it('should return nulls when no matching rows', async () => {
      const exec = sandbox.stub(pool, 'execute');
      exec.onCall(0).resolves([[]]);
      exec.onCall(1).resolves([[]]);
      const res = await AcademicCalendar.getSemesterDates('2024-2025', 'Fall');
      expect(res).to.deep.equal({ start: null, end: null });
    });

    it('should propagate error from either query', async () => {
      const exec = sandbox.stub(pool, 'execute');
      exec.onCall(0).rejects(new Error('first fail'));
      try {
        await AcademicCalendar.getSemesterDates('2024-2025', 'Fall');
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('first fail');
      }
    });
  });
});
