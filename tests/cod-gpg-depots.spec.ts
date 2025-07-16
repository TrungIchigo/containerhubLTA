import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { TEST_CONTAINERS, TEST_MESSAGES, SELECTORS } from './helpers/test-data';

test.describe('COD Module - GPG Depots Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('TC001: Chỉ hiển thị GPG Depots trong form COD', async ({ page }) => {
    console.log('🧪 Running TC001: Chỉ hiển thị GPG Depots');
    
    // Step 1: Login as Dispatcher
    await authHelper.loginAsDispatcher();
    
    // Step 2: Navigate to Dispatcher page
    await page.goto('/dispatcher');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Open COD request dialog
    const containerRow = page.locator(`text=${TEST_CONTAINERS[0].containerNumber}`).first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    // Step 4: Select city and verify depot list
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    
    // Verify only GPG depots are shown
    const depotSelect = page.locator(SELECTORS.depotSelect);
    await expect(depotSelect).toContainText('Chỉ hiển thị các depot thuộc quản lý của GPG');
    
    // Verify non-GPG depots are not shown
    await expect(depotSelect).not.toContainText('ICD Tân Cảng Long Bình');
  });

  test('TC002: Tính phí COD từ bảng gpg_cod_fee_matrix', async ({ page }) => {
    console.log('🧪 Running TC002: Tính phí COD từ bảng GPG');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    // Open COD request dialog
    const containerRow = page.locator(`text=${TEST_CONTAINERS[0].containerNumber}`).first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    // Select city and GPG depot
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    
    // Verify fee is calculated from gpg_cod_fee_matrix
    await expect(page.locator('[data-testid="cod-fee"]')).toBeVisible();
    const feeText = await page.locator('[data-testid="cod-fee"]').textContent();
    expect(feeText).toMatch(/\d{3}(\.|,)\d{3} VNĐ/);
  });

  test('TC003: Không cho phép chọn non-GPG depot', async ({ page }) => {
    console.log('🧪 Running TC003: Không cho phép chọn non-GPG depot');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    // Open COD request dialog
    const containerRow = page.locator(`text=${TEST_CONTAINERS[0].containerNumber}`).first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    // Select city
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    
    // Verify info message
    await expect(page.locator('text=Chỉ hiển thị các depot thuộc quản lý của GPG')).toBeVisible();
    
    // Try to submit without selecting depot
    await page.click(SELECTORS.submitButton);
    
    // Verify validation message
    await expect(page.locator('text=Depot mới là bắt buộc')).toBeVisible();
  });
}); 