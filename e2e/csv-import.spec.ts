/**
 * E2E Test: CSV Import Flow
 *
 * Tests importing portfolio from broker CSV files
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CSV Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio');
  });

  test('should open CSV import modal', async ({ page }) => {
    // Click import button
    await page.click('button:has-text("Import")');

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Import from CSV')).toBeVisible();
  });

  test('should select broker type', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // Broker selection should be visible
    await expect(page.locator('select[name="broker"]')).toBeVisible();

    // Select Zerodha
    await page.selectOption('select[name="broker"]', 'zerodha');

    // Verify selection
    const selectedValue = await page.locator('select[name="broker"]').inputValue();
    expect(selectedValue).toBe('zerodha');
  });

  test('should upload CSV file', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // Create mock CSV file path
    // In real tests, you'd have sample CSV files in fixtures/
    const csvPath = path.join(__dirname, 'fixtures', 'zerodha-sample.csv');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Verify file name is displayed
    await expect(page.locator('text=zerodha-sample.csv')).toBeVisible();
  });

  test('should preview imported data', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // Upload file (mock)
    // ... upload steps ...

    // Click preview
    await page.click('button:has-text("Preview")');

    // Preview table should be visible
    await expect(page.locator('[data-testid="import-preview"]')).toBeVisible();

    // Verify columns
    await expect(page.locator('th:has-text("Symbol")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible();
    await expect(page.locator('th:has-text("Avg Price")')).toBeVisible();
  });

  test('should import positions from CSV', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // ... upload and preview steps ...

    // Click confirm import
    await page.click('button:has-text("Confirm Import")');

    // Wait for import to complete
    await page.waitForTimeout(3000);

    // Verify success message
    await expect(page.locator('text=Successfully imported')).toBeVisible();

    // Positions should be added to portfolio
    const positionCount = await page.locator('[data-testid="position-card"]').count();
    expect(positionCount).toBeGreaterThan(0);
  });

  test('should handle invalid CSV format', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // Upload invalid CSV
    const invalidPath = path.join(__dirname, 'fixtures', 'invalid.csv');
    await page.locator('input[type="file"]').setInputFiles(invalidPath);

    // Click preview
    await page.click('button:has-text("Preview")');

    // Error message should appear
    await expect(page.locator('text=Invalid CSV format')).toBeVisible();
  });

  test('should allow editing imported data before confirm', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // ... upload and preview steps ...

    // Click edit on first row
    await page.click('[data-testid="edit-import-row"]:first-child');

    // Modify quantity
    await page.fill('input[name="quantity"]', '20');

    // Save edit
    await page.click('button:has-text("Save")');

    // Verify edit reflected in preview
    await expect(page.locator('text=20')).toBeVisible();
  });

  test('should support multiple broker formats', async ({ page }) => {
    const brokers = ['zerodha', 'icici', 'hdfc', 'angelone'];

    for (const broker of brokers) {
      await page.click('button:has-text("Import")');

      // Select broker
      await page.selectOption('select[name="broker"]', broker);

      // Verify correct template link shown
      await expect(page.locator(`text=${broker} format`)).toBeVisible();

      // Close modal
      await page.click('button:has-text("Cancel")');
    }
  });

  test('should download sample CSV template', async ({ page }) => {
    await page.click('button:has-text("Import")');

    // Click download template
    const downloadPromise = page.waitForEvent('download');
    await page.click('a:has-text("Download Template")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

/**
 * Sample fixture files needed:
 *
 * e2e/fixtures/zerodha-sample.csv:
 * Symbol,Quantity,Avg Price,LTP,Current Value,P&L
 * RELIANCE,10,2500,2800,28000,3000
 * TCS,5,3500,3800,19000,1500
 *
 * e2e/fixtures/invalid.csv:
 * Invalid,Data,Format
 * No,Headers,Here
 */
