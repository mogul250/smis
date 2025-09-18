# TODO: Fix Failing Tests

## Overview
Current test status: 78 passing, 12 failing (58.93% coverage)
Goal: Fix all 12 failing tests to achieve higher coverage

## Failing Tests Breakdown

### 1. Notification Controller (2 failures)
- **Issue 1:** SQL argument errors
  - Likely incorrect parameter binding in notification queries
  - Check notification model queries for proper parameter usage
- **Issue 2:** 404 on send
  - Notification send endpoint returning 404
  - Check route definition and controller implementation

**Fix Steps:**
- [ ] Review notification model queries for SQL syntax and parameter binding
- [ ] Check notification controller send method implementation
- [ ] Verify notification routes are properly defined
- [ ] Test notification creation and sending functionality

### 2. Teacher Model (4 failures)
- **Issue 1:** JSON parse error on subjects
  - Teacher subjects field stored as JSON but parsing fails
  - Check how subjects are stored/retrieved in teacher model
- **Issue 2:** SQL argument errors
  - Incorrect parameter binding in teacher model queries
  - Review all teacher model database operations

**Fix Steps:**
- [ ] Fix subjects JSON handling in teacher model (create/update/find methods)
- [ ] Review teacher model SQL queries for correct parameter binding
- [ ] Ensure subjects field is properly serialized/deserialized
- [ ] Test teacher CRUD operations with subjects data

### 3. Auth Middleware (4 failures)
- **Issue:** req.user not set in tests
  - Test setup not properly mocking req.user
  - Middleware expects req.user to be set by authentication

**Fix Steps:**
- [ ] Review auth middleware test setup
- [ ] Ensure req.user is properly mocked in test cases
- [ ] Check JWT token validation in middleware
- [ ] Verify middleware correctly sets req.user from token

### 4. Student Routes (1 failure)
- **Issue:** sinon replace error
  - Problem with sinon stubbing in student routes test
  - Likely incorrect usage of sinon.replace

**Fix Steps:**
- [ ] Review student routes test file
- [ ] Fix sinon stubbing syntax (use sinon.stub instead of sinon.replace)
- [ ] Ensure proper cleanup of stubs in test teardown
- [ ] Verify route middleware is properly stubbed

### 5. Utils Helpers (1 failure)
- **Issue:** generateRandomString length mismatch (11 vs 16)
  - Function returns 11 characters instead of expected 16
  - Check implementation of generateRandomString

**Fix Steps:**
- [ ] Review generateRandomString implementation in utils/helpers.js
- [ ] Fix length calculation to return exactly 16 characters
- [ ] Update test expectation if length requirement changed
- [ ] Verify random string generation logic

## Implementation Plan

### Phase 1: Quick Fixes (Low effort)
- [ ] Fix utils/helpers.js generateRandomString length
- [ ] Fix student routes sinon stubbing

### Phase 2: Model Fixes (Medium effort)
- [ ] Fix teacher model subjects JSON handling
- [ ] Fix teacher model SQL parameter binding
- [ ] Fix notification model SQL parameter binding

### Phase 3: Controller/Middleware Fixes (High effort)
- [ ] Fix notification controller send method
- [ ] Fix auth middleware test mocking
- [ ] Verify all route definitions

### Phase 4: Testing and Validation
- [ ] Run full test suite after each fix
- [ ] Verify coverage improvement
- [ ] Ensure no regressions in passing tests

## Expected Outcome
- All 12 failing tests pass
- Coverage increases above 70%
- No new failures introduced
- Clean test output with detailed reporting
