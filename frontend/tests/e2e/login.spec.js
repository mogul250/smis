import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SMIS/);
    
    // Check main heading
    await expect(page.getByText('Welcome to SMIS')).toBeVisible();
    await expect(page.getByText('School Management Information System')).toBeVisible();
    
    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/user type/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation errors
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for email validation error
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should handle login attempt', async ({ page }) => {
    // Fill valid form data
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/user type/i).selectOption('student');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check loading state
    await expect(page.getByText('Signing in...')).toBeVisible();
    
    // Note: In a real test, you'd mock the API response or use a test database
    // For now, we just verify the form submission behavior
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/email/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/password/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/user type/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
  });

  test('should work on mobile devices', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check mobile-specific layout
      await expect(page.getByText('Welcome to SMIS')).toBeVisible();
      
      // Verify form is still usable on mobile
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('password123');
      
      // Check that elements are properly sized for mobile
      const emailInput = page.getByLabel(/email/i);
      const boundingBox = await emailInput.boundingBox();
      expect(boundingBox.height).toBeGreaterThan(40); // Minimum touch target size
    }
  });

  test('should handle different user types', async ({ page }) => {
    const userTypes = ['student', 'teacher', 'hod', 'finance', 'admin'];
    
    for (const userType of userTypes) {
      await page.getByLabel(/user type/i).selectOption(userType);
      const selectedValue = await page.getByLabel(/user type/i).inputValue();
      expect(selectedValue).toBe(userType);
    }
  });

  test('should maintain form state during interaction', async ({ page }) => {
    // Fill form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/user type/i).selectOption('teacher');
    
    // Click somewhere else and verify values are maintained
    await page.getByText('Welcome to SMIS').click();
    
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/password/i)).toHaveValue('password123');
    await expect(page.getByLabel(/user type/i)).toHaveValue('teacher');
  });
});

test.describe('Login Accessibility', () => {
  test('should meet accessibility standards @accessibility', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper heading structure
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check for proper form labels
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/user type/i)).toBeVisible();
    
    // Check for proper button roles
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Check color contrast (basic check)
    const styles = await submitButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Verify button has proper styling (not just default browser styles)
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should work with screen readers @accessibility', async ({ page }) => {
    await page.goto('/login');
    
    // Check ARIA attributes
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check that form inputs have proper labels
    const emailInput = page.getByLabel(/email/i);
    const emailId = await emailInput.getAttribute('id');
    const emailLabel = page.locator(`label[for="${emailId}"]`);
    await expect(emailLabel).toBeVisible();
    
    // Check for error message associations
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify error messages are properly associated with inputs
    const errorMessage = page.getByText('Email is required');
    await expect(errorMessage).toBeVisible();
  });
});
