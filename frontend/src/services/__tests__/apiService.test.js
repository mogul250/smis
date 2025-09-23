import axios from 'axios';
import { authAPI, studentAPI, teacherAPI, hodAPI, financeAPI, adminAPI } from '../apiService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Auth API', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com', role: 'student' },
          token: 'mock-jwt-token'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.login({
        email: 'test@example.com',
        password: 'password123',
        userType: 'student'
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        userType: 'student'
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401
        }
      };
      
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(authAPI.login({
        email: 'test@example.com',
        password: 'wrongpassword',
        userType: 'student'
      })).rejects.toThrow();
    });

    it('should logout successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: 'Logged out' } });

      await authAPI.logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should refresh token', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com', role: 'student' },
          token: 'new-jwt-token'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.refreshToken();

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual(mockResponse.data);
    });

    it('should get current user', async () => {
      const mockResponse = {
        data: { id: 1, email: 'test@example.com', role: 'student' }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await authAPI.getCurrentUser();

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Student API', () => {
    it('should get student dashboard data', async () => {
      const mockResponse = {
        data: {
          student: { id: 1, name: 'John Doe' },
          grades: [],
          attendance: {},
          fees: {}
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await studentAPI.getDashboard();

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/dashboard');
      expect(result).toEqual(mockResponse.data);
    });

    it('should get student grades', async () => {
      const mockResponse = {
        data: {
          grades: [
            { subject: 'Math', grade: 'A', credits: 3 },
            { subject: 'Science', grade: 'B+', credits: 4 }
          ],
          gpa: 3.7
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await studentAPI.getGrades({ semester: 'fall2023' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/grades', {
        params: { semester: 'fall2023' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get attendance records', async () => {
      const mockResponse = {
        data: {
          attendance: [
            { date: '2023-10-01', status: 'present' },
            { date: '2023-10-02', status: 'absent' }
          ],
          statistics: { present: 20, absent: 2, late: 1 }
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await studentAPI.getAttendance({
        startDate: '2023-10-01',
        endDate: '2023-10-31'
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/student/attendance', {
        params: { startDate: '2023-10-01', endDate: '2023-10-31' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should update student profile', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      };
      
      const mockResponse = {
        data: { message: 'Profile updated successfully', user: profileData }
      };
      
      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await studentAPI.updateProfile(profileData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/student/profile', profileData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Teacher API', () => {
    it('should get teacher classes', async () => {
      const mockResponse = {
        data: {
          classes: [
            { id: 1, name: 'Math 101', students: 25 },
            { id: 2, name: 'Math 102', students: 30 }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await teacherAPI.getClasses();

      expect(mockedAxios.get).toHaveBeenCalledWith('/teacher/classes');
      expect(result).toEqual(mockResponse.data);
    });

    it('should submit attendance', async () => {
      const attendanceData = {
        classId: 1,
        date: '2023-10-01',
        attendance: [
          { studentId: 1, status: 'present' },
          { studentId: 2, status: 'absent' }
        ]
      };
      
      const mockResponse = {
        data: { message: 'Attendance submitted successfully' }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await teacherAPI.submitAttendance(attendanceData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/teacher/attendance', attendanceData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should submit grades', async () => {
      const gradesData = {
        classId: 1,
        semester: 'fall2023',
        grades: [
          { studentId: 1, grade: 'A', points: 95 },
          { studentId: 2, grade: 'B+', points: 87 }
        ]
      };
      
      const mockResponse = {
        data: { message: 'Grades submitted successfully' }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await teacherAPI.submitGrades(gradesData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/teacher/grades', gradesData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('HOD API', () => {
    it('should get department overview', async () => {
      const mockResponse = {
        data: {
          department: { id: 1, name: 'Computer Science' },
          teachers: 15,
          students: 200,
          courses: 25
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await hodAPI.getDepartmentOverview();

      expect(mockedAxios.get).toHaveBeenCalledWith('/hod/department');
      expect(result).toEqual(mockResponse.data);
    });

    it('should approve request', async () => {
      const mockResponse = {
        data: { message: 'Request approved successfully' }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await hodAPI.approveRequest(123, 'approved', 'Looks good');

      expect(mockedAxios.post).toHaveBeenCalledWith('/hod/approvals/123', {
        status: 'approved',
        comments: 'Looks good'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Finance API', () => {
    it('should get fee overview', async () => {
      const mockResponse = {
        data: {
          totalFees: 50000,
          collected: 45000,
          outstanding: 5000,
          students: 100
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await financeAPI.getFeeOverview();

      expect(mockedAxios.get).toHaveBeenCalledWith('/finance/fees');
      expect(result).toEqual(mockResponse.data);
    });

    it('should process payment', async () => {
      const paymentData = {
        studentId: 1,
        amount: 1000,
        paymentMethod: 'credit_card',
        feeTypes: ['tuition', 'lab_fee']
      };
      
      const mockResponse = {
        data: { 
          message: 'Payment processed successfully',
          transactionId: 'TXN123456'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await financeAPI.processPayment(paymentData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/finance/payments', paymentData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Admin API', () => {
    it('should get all users', async () => {
      const mockResponse = {
        data: {
          users: [
            { id: 1, email: 'user1@example.com', role: 'student' },
            { id: 2, email: 'user2@example.com', role: 'teacher' }
          ],
          total: 2
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await adminAPI.getAllUsers({ page: 1, limit: 10 });

      expect(mockedAxios.get).toHaveBeenCalledWith('/admin/users', {
        params: { page: 1, limit: 10 }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should update user status', async () => {
      const mockResponse = {
        data: { message: 'User status updated successfully' }
      };
      
      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await adminAPI.updateUserStatus(123, 'active');

      expect(mockedAxios.patch).toHaveBeenCalledWith('/admin/users/123/status', {
        status: 'active'
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get system config', async () => {
      const mockResponse = {
        data: {
          general: { institutionName: 'Test University' },
          security: { sessionTimeout: 60 },
          email: { smtpServer: 'smtp.example.com' }
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await adminAPI.getSystemConfig();

      expect(mockedAxios.get).toHaveBeenCalledWith('/admin/system/config');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(studentAPI.getDashboard()).rejects.toThrow('Network Error');
    });

    it('should handle 401 unauthorized errors', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      
      mockedAxios.get.mockRejectedValue(unauthorizedError);

      await expect(studentAPI.getDashboard()).rejects.toEqual(unauthorizedError);
    });

    it('should handle 500 server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      
      mockedAxios.get.mockRejectedValue(serverError);

      await expect(studentAPI.getDashboard()).rejects.toEqual(serverError);
    });
  });
});
