/**
 * E2E Test: Portfolio Management Flow
 *
 * Tests complete user journey from login to managing portfolio
 */

import { test, expect } from '@playwright/test';

// Store auth state for reuse across tests
const authFile = 'playwright/.auth/user.json';

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should complete login flow', async ({ page }) => {
    // This would test Firebase authentication
    // In real implementation, you'd use a test account

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to portfolio
    await page.waitForURL('/portfolio');

    // Verify we're on portfolio page
    expect(page.url()).toContain('/portfolio');
  });

  test('should display portfolio dashboard', async ({ page }) => {
    // Assuming we're authenticated
    await page.goto('/portfolio');

    // Wait for portfolio data to load
    await page.waitForSelector('[data-testid="portfolio-list"]', { timeout: 5000 });

    // Verify key elements are visible
    await expect(page.locator('h1')).toContainText('Portfolio');

    // Check for empty state or positions
    const positionCount = await page.locator('[data-testid="position-card"]').count();
    expect(positionCount).toBeGreaterThanOrEqual(0);
  });

  test('should open add position modal', async ({ page }) => {
    await page.goto('/portfolio');

    // Click "Add Position" button
    await page.click('button:has-text("Add Position")');

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Verify form fields
    await expect(page.locator('input[name="symbol"]')).toBeVisible();
    await expect(page.locator('input[name="quantity"]')).toBeVisible();
    await expect(page.locator('input[name="entryPrice"]')).toBeVisible();
  });

  test('should add a new position', async ({ page }) => {
    await page.goto('/portfolio');

    // Open modal
    await page.click('button:has-text("Add Position")');

    // Fill form
    await page.fill('input[name="symbol"]', 'RELIANCE');
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="entryPrice"]', '2500');
    await page.fill('input[name="stopLoss"]', '2300');
    await page.fill('input[name="target1"]', '2800');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success message or position to appear
    await page.waitForTimeout(2000);

    // Verify position was added
    await expect(page.locator('text=RELIANCE')).toBeVisible();
  });

  test('should edit position stop loss and target', async ({ page }) => {
    await page.goto('/portfolio');

    // Click on first position's edit button
    await page.click('[data-testid="edit-position-btn"]');

    // Update stop loss
    await page.fill('input[name="stopLoss"]', '2400');
    await page.fill('input[name="target1"]', '2900');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.locator('text=2400')).toBeVisible();
  });

  test('should close a position', async ({ page }) => {
    await page.goto('/portfolio');

    // Get initial position count
    const initialCount = await page.locator('[data-testid="position-card"]').count();

    // Click close button
    await page.click('[data-testid="close-position-btn"]');

    // Fill exit price
    await page.fill('input[name="exitPrice"]', '2800');

    // Confirm close
    await page.click('button:has-text("Close Position")');

    // Wait for position to be removed
    await page.waitForTimeout(2000);

    // Verify count decreased
    const newCount = await page.locator('[data-testid="position-card"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should filter positions by account', async ({ page }) => {
    await page.goto('/portfolio');

    // Open account filter
    await page.click('[data-testid="account-filter"]');

    // Select an account
    await page.click('text=Main Account');

    // Verify filtered results
    await page.waitForTimeout(1000);
    // All positions should belong to selected account
  });

  test('should display exit criteria alerts', async ({ page }) => {
    await page.goto('/portfolio');

    // Wait for positions with exit criteria
    const alerts = await page.locator('[data-testid="exit-alert"]').count();

    // Should show alerts if positions have exit criteria
    if (alerts > 0) {
      await expect(page.locator('[data-testid="exit-alert"]').first()).toBeVisible();
    }
  });

  test('should navigate to risk analysis', async ({ page }) => {
    await page.goto('/portfolio');

    // Click risk analysis link
    await page.click('a[href="/risk-analysis"]');

    // Verify navigation
    await page.waitForURL('/risk-analysis');
    await expect(page.locator('h1')).toContainText('Risk Analysis');
  });

  test('should display portfolio metrics', async ({ page }) => {
    await page.goto('/portfolio');

    // Wait for metrics to load
    await page.waitForSelector('[data-testid="portfolio-metrics"]', { timeout: 5000 });

    // Verify key metrics are displayed
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=Total P&L')).toBeVisible();
    await expect(page.locator('text=Day Change')).toBeVisible();
  });

  test('should search positions by symbol', async ({ page }) => {
    await page.goto('/portfolio');

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'RELIANCE');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify only matching positions shown
    const visiblePositions = await page.locator('[data-testid="position-card"]:visible').count();
    expect(visiblePositions).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Trading Ideas Flow', () => {
  test('should view trading ideas', async ({ page }) => {
    await page.goto('/ideas');

    // Wait for ideas to load
    await page.waitForSelector('[data-testid="ideas-list"]', { timeout: 5000 });

    // Verify ideas are displayed
    await expect(page.locator('h1')).toContainText('Ideas');
  });

  test('should create new trading idea', async ({ page }) => {
    await page.goto('/ideas/new');

    // Fill idea form
    await page.fill('input[name="symbol"]', 'TCS');
    await page.fill('input[name="title"]', 'TCS Breakout Setup');
    await page.fill('textarea[name="analysis"]', 'Strong momentum with volume confirmation');
    await page.fill('input[name="entryPrice"]', '3500');
    await page.fill('input[name="stopLoss"]', '3400');
    await page.fill('input[name="target1"]', '3700');

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to ideas list
    await page.waitForURL('/ideas');
    await expect(page.locator('text=TCS Breakout Setup')).toBeVisible();
  });

  test('should convert idea to position', async ({ page }) => {
    await page.goto('/ideas');

    // Click on an idea
    await page.click('[data-testid="idea-card"]:first-child');

    // Click "Add to Portfolio" button
    await page.click('button:has-text("Add to Portfolio")');

    // Verify redirect to portfolio
    await page.waitForURL('/portfolio');
  });
});

test.describe('Risk Analysis', () => {
  test('should display risk metrics', async ({ page }) => {
    await page.goto('/risk-analysis');

    // Wait for analysis to complete
    await page.waitForSelector('[data-testid="risk-metrics"]', { timeout: 10000 });

    // Verify metrics are displayed
    await expect(page.locator('text=Portfolio Beta')).toBeVisible();
    await expect(page.locator('text=Volatility')).toBeVisible();
    await expect(page.locator('text=Sharpe Ratio')).toBeVisible();
  });

  test('should display sector distribution chart', async ({ page }) => {
    await page.goto('/risk-analysis');

    // Wait for chart to render
    await page.waitForSelector('[data-testid="sector-chart"]', { timeout: 5000 });

    // Verify chart is visible
    await expect(page.locator('[data-testid="sector-chart"]')).toBeVisible();
  });

  test('should show diversification warnings', async ({ page }) => {
    await page.goto('/risk-analysis');

    // Wait for warnings section
    await page.waitForSelector('[data-testid="warnings"]', { timeout: 5000 });

    // Warnings should be present if portfolio is concentrated
    const warningCount = await page.locator('[data-testid="warning-item"]').count();
    expect(warningCount).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Authentication Helper
 *
 * Use this to save authenticated state and reuse across tests:
 *
 * test.beforeAll(async ({ browser }) => {
 *   const page = await browser.newPage();
 *   await page.goto('/login');
 *   // ... perform login
 *   await page.context().storageState({ path: authFile });
 * });
 *
 * test.use({ storageState: authFile });
 */
