import { test, expect } from '@playwright/test';

// Mock user data for testing
const mockStudentUser = {
  id: 1,
  email: 'student@test.com',
  role: 'student',
  first_name: 'John',
  last_name: 'Doe'
};

test.describe('Student Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'student@test.com',
        role: 'student',
        first_name: 'John',
        last_name: 'Doe'
      }));
      localStorage.setItem('token', 'mock-jwt-token');
    });
    
    await page.goto('/student');
  });

  test('should display student dashboard', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Student Dashboard/);
    
    // Check main navigation
    await expect(page.getByText('Student Portal')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Check dashboard cards
    await expect(page.getByText('Academic Performance')).toBeVisible();
    await expect(page.getByText('Attendance Summary')).toBeVisible();
    await expect(page.getByText('Fee Status')).toBeVisible();
    await expect(page.getByText('Upcoming Classes')).toBeVisible();
  });

  test('should navigate to grades page', async ({ page }) => {
    // Click on grades navigation
    await page.getByRole('link', { name: /grades/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/student\/grades/);
    await expect(page.getByText('Academic Grades')).toBeVisible();
    
    // Check grades table structure
    await expect(page.getByText('Subject')).toBeVisible();
    await expect(page.getByText('Grade')).toBeVisible();
    await expect(page.getByText('Credits')).toBeVisible();
  });

  test('should navigate to attendance page', async ({ page }) => {
    // Click on attendance navigation
    await page.getByRole('link', { name: /attendance/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/student\/attendance/);
    await expect(page.getByText('Attendance Records')).toBeVisible();
    
    // Check attendance statistics
    await expect(page.getByText('Present')).toBeVisible();
    await expect(page.getByText('Absent')).toBeVisible();
    await expect(page.getByText('Late')).toBeVisible();
  });

  test('should navigate to fees page', async ({ page }) => {
    // Click on fees navigation
    await page.getByRole('link', { name: /fees/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/student\/fees/);
    await expect(page.getByText('Fee Management')).toBeVisible();
    
    // Check fee information
    await expect(page.getByText('Outstanding Balance')).toBeVisible();
    await expect(page.getByText('Payment History')).toBeVisible();
  });

  test('should navigate to profile page', async ({ page }) => {
    // Click on profile navigation
    await page.getByRole('link', { name: /profile/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/student\/profile/);
    await expect(page.getByText('Student Profile')).toBeVisible();
    
    // Check profile form
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should navigate to timetable page', async ({ page }) => {
    // Click on timetable navigation
    await page.getByRole('link', { name: /timetable/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/student\/timetable/);
    await expect(page.getByText('Class Timetable')).toBeVisible();
    
    // Check timetable grid
    await expect(page.getByText('Monday')).toBeVisible();
    await expect(page.getByText('Tuesday')).toBeVisible();
    await expect(page.getByText('Wednesday')).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome to SMIS')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check mobile navigation
      const menuButton = page.getByRole('button', { name: /menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
      
      // Verify navigation items are accessible
      await expect(page.getByRole('link', { name: /grades/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /attendance/i })).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/student/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.reload();
    
    // Check error handling
    await expect(page.getByText(/error/i)).toBeVisible();
  });

  test('should maintain session state', async ({ page }) => {
    // Navigate to different pages
    await page.getByRole('link', { name: /grades/i }).click();
    await page.getByRole('link', { name: /attendance/i }).click();
    await page.getByRole('link', { name: /dashboard/i }).click();
    
    // Verify user is still authenticated
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Student Portal')).toBeVisible();
  });
});

test.describe('Student Portal Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'student@test.com',
        role: 'student',
        first_name: 'John',
        last_name: 'Doe'
      }));
      localStorage.setItem('token', 'mock-jwt-token');
    });
    
    await page.goto('/student');
  });

  test('should have proper heading hierarchy @accessibility', async ({ page }) => {
    // Check main heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check section headings
    const h2Elements = page.getByRole('heading', { level: 2 });
    expect(await h2Elements.count()).toBeGreaterThan(0);
  });

  test('should have keyboard navigation @accessibility', async ({ page }) => {
    // Test tab navigation through main elements
    await page.keyboard.press('Tab');
    
    // Should be able to navigate to all interactive elements
    const focusableElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels @accessibility', async ({ page }) => {
    // Check navigation has proper labels
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check buttons have accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || await button.textContent();
      expect(accessibleName).toBeTruthy();
    }
  });
});
