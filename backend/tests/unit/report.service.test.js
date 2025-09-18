import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import pool from '../../src/config/database.js';
import ReportService from '../../src/services/report-service.js';

describe('ReportService Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('generateAttendanceReport', () => {
    it('should aggregate attendance stats and return structured data', async () => {
      const rows = [
        { date: '2024-01-01', status: 'present', notes: '', course_name: 'Math', first_name: 'T', last_name: 'One' },
        { date: '2024-01-02', status: 'absent', notes: '', course_name: 'Science', first_name: 'T', last_name: 'Two' },
        { date: '2024-01-03', status: 'present', notes: '', course_name: 'Math', first_name: 'T', last_name: 'One' }
      ];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await ReportService.generateAttendanceReport(1, '2024-01-01', '2024-01-31');
      expect(res.studentId).to.equal(1);
      expect(res.records).to.deep.equal(rows);
      expect(res.summary.totalDays).to.equal(3);
      expect(res.summary.presentDays).to.equal(2);
      expect(res.summary.absentDays).to.equal(1);
      expect(parseFloat(res.summary.attendancePercentage)).to.equal(parseFloat(((2/3)*100).toFixed(2)));
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('db fail'));
      try {
        await ReportService.generateAttendanceReport(1, '2024-01-01', '2024-01-31');
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error generating attendance report');
      }
    });
  });

  describe('generateGradeReport', () => {
    it('should compute GPA and return summary', async () => {
      const rows = [
        { grade: 'A', semester: 'Fall', year: 2024, comments: '', course_name: 'Math', credits: 3, teacher_first_name: 'T', teacher_last_name: 'A' },
        { grade: 'B', semester: 'Fall', year: 2024, comments: '', course_name: 'Science', credits: 4, teacher_first_name: 'T', teacher_last_name: 'B' }
      ];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await ReportService.generateGradeReport(1, 'Fall', 2024);
      expect(res.studentId).to.equal(1);
      expect(res.grades).to.deep.equal(rows);
      expect(res.summary.totalCourses).to.equal(2);
      // GPA = (4.0*3 + 3.0*4) / 7 = (12 + 12) / 7 = 24/7 = 3.43...
      expect(parseFloat(res.summary.gpa)).to.be.closeTo(3.43, 0.01);
      expect(res.summary.totalCredits).to.equal(7);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('db fail'));
      try {
        await ReportService.generateGradeReport(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error generating grade report');
      }
    });
  });

  describe('generateFinancialReport', () => {
    it('should compute totals and overdue stats', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000).toISOString().slice(0,10);
      const future = new Date(now.getTime() + 86400000).toISOString().slice(0,10);
      const rows = [
        { amount: '100.00', type: 'tuition', due_date: past, paid_date: past, status: 'paid', description: '' },
        { amount: '250.50', type: 'lab', due_date: future, paid_date: null, status: 'pending', description: '' },
        { amount: '75.25', type: 'library', due_date: past, paid_date: null, status: 'pending', description: '' }
      ];
      sandbox.stub(pool, 'execute').resolves([rows]);
      const res = await ReportService.generateFinancialReport(1);
      expect(res.fees).to.deep.equal(rows);
      expect(res.summary.totalPaid).to.equal(100.00);
      expect(res.summary.totalOutstanding).to.equal(325.75);
      expect(res.summary.overdueCount).to.equal(1);
      expect(res.summary.overdueAmount).to.equal(75.25);
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('db fail'));
      try {
        await ReportService.generateFinancialReport(1);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error generating financial report');
      }
    });
  });

  describe('generateDepartmentReport', () => {
    it('should aggregate department metrics', async () => {
      const exec = sandbox.stub(pool, 'execute');
      exec.onCall(0).resolves([[{ id: 3, name: 'Engineering' }]]);                     // dept
      exec.onCall(1).resolves([[{ id: 1 }, { id: 2 }, { id: 3 }]]);                    // students list
      exec.onCall(2).resolves([[{ avg_attendance: 87.5 }]]);                           // attendance avg
      exec.onCall(3).resolves([[{ avg_gpa: 3.1 }]]);                                   // gpa avg

      const res = await ReportService.generateDepartmentReport(3, 'Fall', 2024);
      expect(res.department).to.equal('Engineering');
      expect(res.studentCount).to.equal(3);
      expect(res.averageAttendance).to.equal('87.50');
      expect(res.averageGpa).to.equal('3.10');
    });

    it('should wrap DB error', async () => {
      sandbox.stub(pool, 'execute').rejects(new Error('db fail'));
      try {
        await ReportService.generateDepartmentReport(1, 'Fall', 2024);
        expect.fail('Expected error');
      } catch (err) {
        expect(err.message).to.include('Error generating department report');
      }
    });
  });

  describe('convertGradeToPoint', () => {
    it('should map known grades and default to 0', () => {
      expect(ReportService.convertGradeToPoint('A')).to.equal(4.0);
      expect(ReportService.convertGradeToPoint('B+')).to.equal(3.3);
      expect(ReportService.convertGradeToPoint('Z')).to.equal(0);
    });
  });

  describe('exportToPDF', () => {
    it('should write a PDF file and resolve with file path', async () => {
      const tmpFile = path.join(process.cwd(), 'report-test.pdf');
      try {
        const data = {
          studentId: 1,
          period: { startDate: '2024-01-01', endDate: '2024-01-31' },
          records: [
            { date: '2024-01-01', status: 'present', course_name: 'Math', first_name: 'T', last_name: 'One' }
          ],
          summary: { totalDays: 1, presentDays: 1, absentDays: 0, attendancePercentage: '100.00' }
        };
        const out = await ReportService.exportToPDF(data, 'Attendance', tmpFile);
        expect(out).to.equal(tmpFile);
        expect(fs.existsSync(tmpFile)).to.be.true;
      } finally {
        // cleanup
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      }
    });
  });
});
