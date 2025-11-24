import { test, expect } from '@playwright/test';

const SAMPLE_EMAIL = process.env.PLAYWRIGHT_EMAIL || 'client@example.com';
const SAMPLE_PASSWORD = process.env.PLAYWRIGHT_PASSWORD || 'password123';

const SELECTORS = {
  loginEmail: '#email',
  loginPassword: '#password',
  submitButton: 'button[type="submit"]',
  homeHeading: 'h1:text("Personalised chef matches")',
  bottomNav: 'nav[role="navigation"]',
};

test.describe('Auth smoke flow', () => {
  test('client login lands on /client/home and renders key UI', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/\/login$/);

    // Fill in credentials
    await page.fill(SELECTORS.loginEmail, SAMPLE_EMAIL);
    await page.fill(SELECTORS.loginPassword, SAMPLE_PASSWORD);

    // Click submit and wait for navigation to complete
    await Promise.all([
      page.waitForURL('**/client/home', { timeout: 10000 }),
      page.click(SELECTORS.submitButton),
    ]);

    // Verify final URL
    await expect(page).toHaveURL(/\/client\/home$/);
    
    // Verify key UI elements are visible
    await expect(page.locator(SELECTORS.homeHeading)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SELECTORS.bottomNav)).toBeVisible({ timeout: 5000 });
  });

  test('client registration creates account and redirects to /client/home', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register');
    
    // Verify we're on the register page
    await expect(page).toHaveURL(/\/register$/);

    // Fill in registration form
    const timestamp = Date.now();
    await page.fill('input[id="fullName"]', 'Test User');
    await page.fill('input[id="username"]', `testuser_${timestamp}`);
    await page.fill('input[id="email"]', `test_${timestamp}@example.com`);
    await page.fill('input[id="password"]', 'TestPassword123!');

    // Ensure client role is selected
    await page.click('button:has-text("Client")');

    // Submit and wait for navigation
    await Promise.all([
      page.waitForURL('**/client/home', { timeout: 10000 }),
      page.click('button:has-text("Create account")'),
    ]);

    // Verify final URL
    await expect(page).toHaveURL(/\/client\/home$/);
    
    // Verify key UI elements are visible
    await expect(page.locator(SELECTORS.homeHeading)).toBeVisible({ timeout: 5000 });
  });
});
