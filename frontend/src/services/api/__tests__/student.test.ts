import { jest } from '@jest/globals';
import axios from 'axios';
import studentAPI, {
  getProfile,
  updateProfile,
  getGrades,
  getAttendance,
  getFees,
  getTimetable,
} from '../student';
import { 
  StudentProfile, 
  UpdateStudentProfile, 
  GradesResponse, 
  AttendanceRecord, 
  FeesResponse, 
  TimetableEntry 
} from '../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Student API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('student-token');
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Success Cases', () => {
    it('should successfully get student profile', async () => {
      const mockProfile: StudentProfile = {
        id: 1,
        user: {
          email: 'student@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockProfile });

      const result = await getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/profile');
      expect(result).toEqual(mockProfile);
    });

    it('should successfully update student profile', async () => {
      const updateData: UpdateStudentProfile = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      };

      const mockResponse = { message: 'Profile updated successfully' };
      mockedAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await updateProfile(updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/student/profile', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should successfully get student grades', async () => {
      const mockGrades: GradesResponse = {
        grades: [
          {
            id: 1,
            course_id: 1,
            grade: 'A',
            semester: 'Fall 2024',
            year: 2024,
            comments: 'Excellent work',
            course_name: 'Mathematics',
          },
        ],
        gpa: 3.8,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockGrades });

      const result = await getGrades();

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/grades');
      expect(result).toEqual(mockGrades);
    });

    it('should successfully get student attendance', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockAttendance: AttendanceRecord[] = [
        {
          id: 1,
          student_id: 1,
          course_id: 1,
          date: '2024-01-15',
          status: 'present',
          notes: '',
          course_name: 'Mathematics',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockAttendance });

      const result = await getAttendance(startDate, endDate);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/student/attendance/startDate=${startDate}/endDate=${endDate}`);
      expect(result).toEqual(mockAttendance);
    });

    it('should successfully get student fees', async () => {
      const mockFees: FeesResponse = {
        fees: [
          {
            id: 1,
            fee_type: 'Tuition',
            amount: 5000,
            due_date: '2024-02-01',
            status: 'unpaid',
          },
        ],
        totalOutstanding: 5000,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockFees });

      const result = await getFees();

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/fees');
      expect(result).toEqual(mockFees);
    });

    it('should successfully get student timetable', async () => {
      const semester = 'Fall 2024';
      const mockTimetable: TimetableEntry[] = [
        {
          id: 1,
          course_id: 1,
          teacher_id: 1,
          day_of_week: 1,
          start_time: '09:00:00',
          end_time: '10:30:00',
          course_name: 'Mathematics',
          teacher_name: 'Dr. Smith',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockTimetable });

      const result = await getTimetable(semester);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/student/timetable/semester=${encodeURIComponent(semester)}`);
      expect(result).toEqual(mockTimetable);
    });

    it('should get timetable with default semester when none provided', async () => {
      const mockTimetable: TimetableEntry[] = [];
      mockedAxios.get.mockResolvedValueOnce({ data: mockTimetable });

      await getTimetable();

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/timetable/semester=current');
    });
  });

  describe('Error Cases', () => {
    it('should handle 400 Bad Request for invalid date format', async () => {
      const invalidStartDate = '2024-1-1'; // Invalid format
      const endDate = '2024-01-31';

      await expect(getAttendance(invalidStartDate, endDate)).rejects.toThrow('Invalid start date format. Use YYYY-MM-DD');
    });

    it('should handle missing required parameters for attendance', async () => {
      await expect(getAttendance('', '2024-01-31')).rejects.toThrow('Start date and end date are required');
      await expect(getAttendance('2024-01-01', '')).rejects.toThrow('Start date and end date are required');
    });

    it('should handle invalid date range for attendance', async () => {
      const startDate = '2024-01-31';
      const endDate = '2024-01-01'; // End before start

      await expect(getAttendance(startDate, endDate)).rejects.toThrow('Start date must be before or equal to end date');
    });

    it('should handle 401 Unauthorized - not authenticated as student', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Authentication required' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(getProfile()).rejects.toMatchObject({
        status: 401,
        message: 'Authentication required',
      });
    });

    it('should handle 403 Forbidden - insufficient permissions', async () => {
      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Access denied. Student role required' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(getProfile()).rejects.toMatchObject({
        status: 403,
        message: 'Access denied. Student role required',
      });
    });

    it('should handle 404 Not Found', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Student not found' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(getProfile()).rejects.toMatchObject({
        status: 404,
        message: 'Student not found',
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(getProfile()).rejects.toMatchObject({
        status: 500,
        message: 'Internal server error',
      });
    });

    it('should validate email format in profile update', async () => {
      const updateData: UpdateStudentProfile = {
        email: 'invalid-email-format',
      };

      await expect(updateProfile(updateData)).rejects.toThrow('Invalid email format');
    });

    it('should validate date formats in profile update', async () => {
      const updateData: UpdateStudentProfile = {
        date_of_birth: '2000-1-1', // Invalid format
      };

      await expect(updateProfile(updateData)).rejects.toThrow('Invalid date format. Use YYYY-MM-DD');
    });

    it('should validate department ID in profile update', async () => {
      const updateData: UpdateStudentProfile = {
        department_id: -1, // Invalid negative ID
      };

      await expect(updateProfile(updateData)).rejects.toThrow('Department ID must be a positive integer');
    });

    it('should validate enrollment year in profile update', async () => {
      const updateData: UpdateStudentProfile = {
        enrollment_year: 1999, // Too old
      };

      await expect(updateProfile(updateData)).rejects.toThrow('Invalid enrollment year');
    });

    it('should validate current year in profile update', async () => {
      const updateData: UpdateStudentProfile = {
        current_year: 15, // Too high
      };

      await expect(updateProfile(updateData)).rejects.toThrow('Current year must be between 1 and 10');
    });

    it('should validate status in profile update', async () => {
      const updateData: UpdateStudentProfile = {
        status: 'invalid-status' as any,
      };

      await expect(updateProfile(updateData)).rejects.toThrow('Invalid status. Must be one of: active, inactive, graduated, suspended');
    });

    it('should validate semester parameter for timetable', async () => {
      await expect(getTimetable('')).rejects.toThrow('Semester must be a non-empty string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      const networkError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(getProfile()).rejects.toMatchObject({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });
    });

    it('should handle malformed response', async () => {
      const malformedResponse = {
        data: null, // Unexpected null response
      };

      mockedAxios.get.mockResolvedValueOnce(malformedResponse);

      const result = await getProfile();
      expect(result).toBe(null);
    });

    it('should handle empty attendance records', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const emptyAttendance: AttendanceRecord[] = [];

      mockedAxios.get.mockResolvedValueOnce({ data: emptyAttendance });

      const result = await getAttendance(startDate, endDate);
      expect(result).toEqual([]);
    });

    it('should handle empty fees response', async () => {
      const emptyFees: FeesResponse = {
        fees: [],
        totalOutstanding: 0,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: emptyFees });

      const result = await getFees();
      expect(result).toEqual(emptyFees);
    });
  });

  describe('Helper Methods', () => {
    it('should get attendance summary correctly', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockAttendance: AttendanceRecord[] = [
        {
          id: 1,
          student_id: 1,
          course_id: 1,
          date: '2024-01-15',
          status: 'present',
          notes: '',
          course_name: 'Math',
        },
        {
          id: 2,
          student_id: 1,
          course_id: 1,
          date: '2024-01-16',
          status: 'absent',
          notes: '',
          course_name: 'Math',
        },
        {
          id: 3,
          student_id: 1,
          course_id: 1,
          date: '2024-01-17',
          status: 'late',
          notes: '',
          course_name: 'Math',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockAttendance });

      const result = await studentAPI.getAttendanceSummary(startDate, endDate);

      expect(result.totalClasses).toBe(3);
      expect(result.presentCount).toBe(1);
      expect(result.absentCount).toBe(1);
      expect(result.lateCount).toBe(1);
      expect(result.attendancePercentage).toBe(33); // 1/3 * 100 rounded
      expect(result.records).toEqual(mockAttendance);
    });

    it('should get outstanding fees summary correctly', async () => {
      const mockFees: FeesResponse = {
        fees: [
          {
            id: 1,
            fee_type: 'Tuition',
            amount: 5000,
            due_date: '2024-02-01',
            status: 'paid',
          },
          {
            id: 2,
            fee_type: 'Library',
            amount: 100,
            due_date: '2023-12-01', // Overdue
            status: 'unpaid',
          },
          {
            id: 3,
            fee_type: 'Lab',
            amount: 200,
            due_date: '2024-03-01',
            status: 'unpaid',
          },
        ],
        totalOutstanding: 300,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockFees });

      const result = await studentAPI.getOutstandingFeesSummary();

      expect(result.totalFees).toBe(3);
      expect(result.paidFees).toBe(1);
      expect(result.unpaidFees).toBe(2);
      expect(result.totalOutstanding).toBe(300);
      expect(result.overdueFees).toBe(1); // Only the library fee is overdue
    });
  });
});
