# API Integration Troubleshooting Guide

This guide helps you diagnose and fix common issues with the SMIS API integration.

## Common HTTP Status Codes and Solutions

### 400 Bad Request
**Cause:** Invalid request body, missing required fields, wrong data types, or validation errors.

**Common Issues:**
- Missing required fields in request body
- Invalid data types (string vs number)
- Invalid date formats (must be YYYY-MM-DD)
- Invalid email formats
- Negative numbers where positive integers are required
- Invalid enum values (e.g., attendance status, user roles)

**Solutions:**
1. Check request body matches API documentation exactly
2. Validate all required fields are present
3. Ensure correct data types:
   ```typescript
   // Correct
   { studentId: 123, amount: 100.50, date: "2024-01-15" }
   
   // Incorrect
   { studentId: "123", amount: "100.50", date: "2024-1-15" }
   ```
4. Use validation helpers:
   ```typescript
   import { validateEmail, validateDateFormat, validatePositiveNumber } from '@/services/api';
   
   if (!validateEmail(email)) {
     throw new Error('Invalid email format');
   }
   ```

**Example Error Messages:**
- "Missing required fields: email, password"
- "Invalid email format"
- "Invalid date format. Use YYYY-MM-DD"
- "Amount must be a positive number"

### 401 Unauthorized
**Cause:** Missing, invalid, or expired JWT token.

**Common Issues:**
- No token in localStorage
- Token has expired (24-hour validity)
- Token was cleared by another tab/window
- User logged out in another session

**Solutions:**
1. Check if token exists:
   ```typescript
   import { isAuthenticated, getAuthToken } from '@/services/api';
   
   if (!isAuthenticated()) {
     // Redirect to login
     window.location.href = '/login';
   }
   ```

2. Handle token expiration:
   ```typescript
   try {
     const result = await studentAPI.getProfile();
   } catch (error) {
     if (error.status === 401) {
       // Token expired, redirect to login
       authAPI.clearAuth();
       window.location.href = '/login';
     }
   }
   ```

3. Re-login if needed:
   ```typescript
   // The API automatically clears token and redirects on 401
   // No manual handling needed in most cases
   ```

**Automatic Handling:**
The API service automatically handles 401 errors by:
- Clearing the auth token from localStorage
- Redirecting to `/login` page (if not already there)

### 403 Forbidden
**Cause:** Insufficient permissions for the endpoint.

**Common Issues:**
- Wrong user role for endpoint (e.g., student trying to access teacher endpoints)
- Department authorization failure for HOD endpoints
- Course authorization failure for teacher endpoints

**Solutions:**
1. Verify user role matches endpoint requirements:
   ```typescript
   // Check user role before making requests
   const profile = await authAPI.getProfile();
   if (profile.user.role !== 'teacher') {
     throw new Error('Teacher access required');
   }
   ```

2. For HOD endpoints, ensure user is HOD of the correct department
3. For teacher endpoints, ensure teacher is assigned to the course

**Role Requirements:**
- `/api/student/*` - Student role required
- `/api/teacher/*` - Teacher role required
- `/api/hod/*` - HOD role + department authorization required
- `/api/finance/*` - Finance role required
- `/api/admin/*` - Admin role required

### 404 Not Found
**Cause:** Invalid ID or endpoint path.

**Common Issues:**
- Entity doesn't exist in database (student, course, etc.)
- Incorrect endpoint URL
- Invalid path parameters

**Solutions:**
1. Verify entity exists before making requests:
   ```typescript
   // Check if student exists before getting fees
   try {
     const fees = await financeAPI.getStudentFees(studentId);
   } catch (error) {
     if (error.status === 404) {
       console.error('Student not found');
     }
   }
   ```

2. Validate IDs are positive integers:
   ```typescript
   import { validatePositiveNumber } from '@/services/api';
   
   if (!validatePositiveNumber(studentId)) {
     throw new Error('Invalid student ID');
   }
   ```

3. Check endpoint URLs match documentation exactly

### 409 Conflict
**Cause:** Duplicate data or constraint violations.

**Common Issues:**
- Email already exists when creating users
- Course code already exists
- Department code already exists

**Solutions:**
1. Check for existing data before creating:
   ```typescript
   try {
     await adminAPI.createUser(userData);
   } catch (error) {
     if (error.status === 409) {
       console.error('User with this email already exists');
       // Show user-friendly message
     }
   }
   ```

2. Use unique identifiers (timestamps, UUIDs) for test data

### 422 Unprocessable Entity
**Cause:** Validation failed on the server side.

**Common Issues:**
- Business logic validation failures
- Complex validation rules not caught by client

**Solutions:**
1. Check server response for specific validation errors
2. Implement client-side validation to match server rules

### 500 Internal Server Error
**Cause:** Backend error, database issues, or server problems.

**Common Issues:**
- Database connection problems
- Null/undefined handling in backend
- Server configuration issues

**Solutions:**
1. Check backend logs for detailed error information
2. Verify database connection
3. Retry the request after a delay:
   ```typescript
   import { retryWithDelay } from '@/utils/retry';
   
   const result = await retryWithDelay(
     () => studentAPI.getProfile(),
     3, // max retries
     1000 // delay in ms
   );
   ```

4. Contact system administrator if persistent

## Network and Connection Issues

### Network Timeout
**Cause:** Request takes longer than 30 seconds.

**Solutions:**
1. Check network connection
2. Verify backend server is running
3. Check for large data transfers that might need pagination

### CORS Errors
**Cause:** Cross-origin request blocked by browser.

**Solutions:**
1. Ensure backend CORS is configured correctly
2. Check API base URL configuration:
   ```typescript
   // In .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Connection Refused
**Cause:** Backend server is not running or unreachable.

**Solutions:**
1. Start the backend server
2. Check the API base URL
3. Verify firewall settings

## Debugging Tools and Techniques

### Enable Development Logging
The API service automatically logs requests and responses in development mode:

```typescript
// Logs appear in browser console
// 🚀 API Request: POST /auth/login
// ✅ API Response: POST /auth/login (200)
// ❌ API Error: POST /auth/login (401)
```

### Test Individual Endpoints
Use the integration test script to test specific endpoints:

```bash
npm run test:integration
```

### Manual Testing with Browser DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make API requests and inspect:
   - Request headers (Authorization token)
   - Request body (JSON format)
   - Response status and body
   - Response headers

### Using API Testing Tools
Test endpoints directly with tools like:
- Postman
- Insomnia
- curl commands

Example curl command:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Common Validation Errors

### Date Format Errors
```typescript
// ❌ Wrong
const date = "2024-1-1";
const date = "01/15/2024";

// ✅ Correct
const date = "2024-01-01";
const date = new Date().toISOString().split('T')[0];
```

### Email Format Errors
```typescript
// ❌ Wrong
const email = "user@";
const email = "user.domain.com";

// ✅ Correct
const email = "user@domain.com";
```

### Number Validation Errors
```typescript
// ❌ Wrong
const id = "123";
const amount = "-100";

// ✅ Correct
const id = 123;
const amount = 100;
```

## Performance Optimization

### Pagination
Use pagination for large datasets:
```typescript
// Admin endpoints use offset/limit pattern
const users = await adminAPI.getAllUsers(1, 10); // page 1, 10 items

// Other endpoints use page/limit pattern
const notifications = await notificationsAPI.getNotifications(1, 10);
```

### Caching
Implement caching for frequently accessed data:
```typescript
// Use React Query or SWR for caching
import { useQuery } from 'react-query';

const { data: profile } = useQuery(
  'student-profile',
  () => studentAPI.getProfile(),
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);
```

### Error Boundaries
Implement error boundaries to catch and handle API errors gracefully:
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <StudentDashboard />
</ErrorBoundary>
```

## Getting Help

### Check Documentation
1. Review API documentation: `docs/api-documentation.md`
2. Check usage examples: `API_USAGE_EXAMPLES.md`
3. Review type definitions: `src/services/api/types.ts`

### Debug Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test with integration script
4. Check backend logs
5. Verify database state

### Contact Support
If issues persist:
1. Gather error details (status code, error message, request/response)
2. Note steps to reproduce
3. Check if issue occurs with other users/roles
4. Contact development team with details

## Quick Reference

### Import Statements
```typescript
// Individual APIs
import { authAPI, studentAPI, teacherAPI, hodAPI, financeAPI, adminAPI, notificationsAPI } from '@/services/api';

// Utilities
import { validateEmail, validateDateFormat, getErrorMessage } from '@/services/api';

// Types
import { LoginRequest, StudentProfile, AttendanceData } from '@/services/api';
```

### Error Handling Pattern
```typescript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  const message = getErrorMessage(error);
  console.error('API Error:', message);
  
  // Handle specific errors
  if (error.status === 401) {
    // Redirect to login
  } else if (error.status === 403) {
    // Show permission error
  } else {
    // Show generic error
  }
}
```

### Authentication Check
```typescript
import { isAuthenticated } from '@/services/api';

if (!isAuthenticated()) {
  // Redirect to login
  window.location.href = '/login';
}
```
