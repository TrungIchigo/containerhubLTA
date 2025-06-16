import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { TEST_MESSAGES, SELECTORS } from './helpers/test-data';

test.describe('COD Module - Technical & Edge Cases', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('TC036: Race Condition - Đồng Thời Tạo COD và Street-turn', async ({ page, context }) => {
    console.log('🧪 Running TC036: Race Condition Test');
    
    // Create two pages to simulate concurrent users
    const page2 = await context.newPage();
    const authHelper2 = new AuthHelper(page2);
    
    // Login both pages as dispatcher
    await authHelper.loginAsDispatcher();
    await authHelper2.loginAsDispatcher();
    
    // Navigate both to dispatcher page
    await page.goto('/dispatcher');
    await page2.goto('/dispatcher');
    
    await page.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Find the same container on both pages
    const containerRow1 = page.locator('text=MSKU1234567').first();
    const containerRow2 = page2.locator('text=MSKU1234567').first();
    
    await expect(containerRow1).toBeVisible();
    await expect(containerRow2).toBeVisible();
    
    // Simultaneously try to create COD and Street-turn requests
    const [result1, result2] = await Promise.allSettled([
      // Page 1: Create COD request
      (async () => {
        const actionButton1 = containerRow1.locator('..').locator('[data-testid="action-menu"]');
        await actionButton1.click();
        await page.click(SELECTORS.codRequestButton);
        await page.waitForSelector(SELECTORS.citySelect);
        await page.click(SELECTORS.citySelect);
        await page.click('text=Thành phố Hồ Chí Minh');
        await page.click(SELECTORS.depotSelect);
        await page.click('text=Cảng Cát Lái');
        await page.fill(SELECTORS.reasonInput, 'Race condition test');
        await page.click(SELECTORS.submitButton);
      })(),
      
      // Page 2: Create Street-turn request
      (async () => {
        const actionButton2 = containerRow2.locator('..').locator('[data-testid="action-menu"]');
        await actionButton2.click();
        await page2.click('[data-testid="street-turn-button"]');
        // Fill street-turn form...
        await page2.click('[data-testid="street-turn-submit"]');
      })()
    ]);
    
    // Verify only one request succeeded
    const hasError1 = await page.locator('text=' + TEST_MESSAGES.error.containerNotAvailable).isVisible();
    const hasError2 = await page2.locator('text=' + TEST_MESSAGES.error.containerNotAvailable).isVisible();
    
    // At least one should have error
    expect(hasError1 || hasError2).toBeTruthy();
    
    console.log('✅ TC036 PASSED: Race condition handled correctly');
    
    await page2.close();
  });

  test('TC037: Container Status Validation', async ({ page }) => {
    console.log('🧪 Running TC037: Container Status Validation');
    
    await authHelper.loginAsDispatcher();
    
    // First, manually update container status via API or database
    // This simulates a container that's no longer available
    await page.evaluate(async () => {
      // Mock API call to change container status
      await fetch('/api/test/update-container-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerNumber: 'MSKU1234567',
          status: 'IN_USE'
        })
      });
    });
    
    await page.goto('/dispatcher');
    await page.waitForLoadState('networkidle');
    
    // Try to create COD request for the unavailable container
    const containerRow = page.locator('text=MSKU1234567').first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    // Fill form and submit
    await page.waitForSelector(SELECTORS.citySelect);
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    await page.fill(SELECTORS.reasonInput, 'Status validation test');
    await page.click(SELECTORS.submitButton);
    
    // Verify error message
    await expect(page.locator('text=' + TEST_MESSAGES.error.containerNotAvailable)).toBeVisible();
    
    console.log('✅ TC037 PASSED: Container status validation working');
  });

  test('TC038: COD Request Status Validation', async ({ page }) => {
    console.log('🧪 Running TC038: COD Request Status Validation');
    
    await authHelper.loginAsCarrierAdmin();
    await page.goto('/carrier-admin');
    await page.click(SELECTORS.codTab);
    
    // Find a request and manually change its status
    const requestRow = page.locator('[data-testid="cod-request-row"]').first();
    await expect(requestRow).toBeVisible();
    
    // Get request ID and manually update status
    const requestId = await requestRow.getAttribute('data-request-id');
    
    await page.evaluate(async (id) => {
      // Mock API call to change request status
      await fetch('/api/test/update-cod-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: id,
          status: 'APPROVED'
        })
      });
    }, requestId);
    
    // Try to approve the already processed request
    const actionButton = requestRow.locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.approveButton);
    await page.click('text=Xác nhận');
    
    // Verify error message
    await expect(page.locator('text=' + TEST_MESSAGES.error.requestAlreadyProcessed)).toBeVisible();
    
    console.log('✅ TC038 PASSED: COD request status validation working');
  });

  test('TC039: Database Transaction Rollback', async ({ page }) => {
    console.log('🧪 Running TC039: Database Transaction Rollback');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    // Mock a database error during COD creation
    await page.route('**/api/cod/create', async route => {
      // Simulate database connection failure
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      });
    });
    
    // Try to create COD request
    const containerRow = page.locator('text=MSKU1234567').first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    await page.waitForSelector(SELECTORS.citySelect);
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    await page.fill(SELECTORS.reasonInput, 'Transaction rollback test');
    await page.click(SELECTORS.submitButton);
    
    // Verify error handling
    await expect(page.locator('text=Database connection failed')).toBeVisible();
    
    // Verify container status hasn't changed (rollback worked)
    await page.reload();
    await expect(page.locator('text=Sẵn sàng')).toBeVisible(); // Should still be AVAILABLE
    
    console.log('✅ TC039 PASSED: Database transaction rollback working');
  });

  test('TC040: Invalid Depot Selection', async ({ page }) => {
    console.log('🧪 Running TC040: Invalid Depot Selection');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    const containerRow = page.locator('text=MSKU1234567').first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    await page.waitForSelector(SELECTORS.citySelect);
    
    // Select city A
    await page.click(SELECTORS.citySelect);
    await page.click('text=Hà Nội');
    
    // Manually modify DOM to select depot from city B
    await page.evaluate(() => {
      const depotSelect = document.querySelector('[data-testid="depot-select"]') as HTMLSelectElement;
      if (depotSelect) {
        // Add option from different city
        const option = document.createElement('option');
        option.value = 'depot-from-hcm';
        option.textContent = 'Cảng Cát Lái'; // This is from HCM, not Hanoi
        depotSelect.appendChild(option);
        depotSelect.value = 'depot-from-hcm';
      }
    });
    
    await page.fill(SELECTORS.reasonInput, 'Invalid depot test');
    await page.click(SELECTORS.submitButton);
    
    // Verify server validation catches the error
    await expect(page.locator('text=Depot được chọn không thuộc thành phố đã chọn')).toBeVisible();
    
    console.log('✅ TC040 PASSED: Invalid depot selection validation working');
  });

  test('TC041: Audit Log Integrity', async ({ page }) => {
    console.log('🧪 Running TC041: Audit Log Integrity');
    
    // This test would require access to database or audit log API
    // For now, we'll simulate the flow and verify the actions are logged
    
    await authHelper.loginAsDispatcher();
    
    // Step 1: Create COD request
    await page.goto('/dispatcher');
    const containerRow = page.locator('text=MSKU1234567').first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    await page.waitForSelector(SELECTORS.citySelect);
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    await page.fill(SELECTORS.reasonInput, 'Audit log test');
    await page.click(SELECTORS.submitButton);
    
    // Wait for success
    await expect(page.locator(SELECTORS.toast)).toContainText(TEST_MESSAGES.success.codRequestCreated);
    
    // Step 2: Switch to Carrier Admin and approve
    await authHelper.loginAsCarrierAdmin();
    await page.goto('/carrier-admin');
    await page.click(SELECTORS.codTab);
    
    const pendingRequest = page.locator(SELECTORS.pendingBadge).first();
    const carrierActionButton = pendingRequest.locator('..').locator('[data-testid="action-menu"]');
    await carrierActionButton.click();
    await page.click(SELECTORS.approveButton);
    await page.click('text=Xác nhận');
    
    // Step 3: Verify audit logs via API
    const auditLogs = await page.evaluate(async () => {
      const response = await fetch('/api/audit/cod-logs');
      return response.json();
    });
    
    // Verify we have logs for CREATE and APPROVED actions
    expect(auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'CREATED' }),
        expect.objectContaining({ action: 'APPROVED' })
      ])
    );
    
    console.log('✅ TC041 PASSED: Audit log integrity verified');
  });
}); 