import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { TEST_CONTAINERS, TEST_MESSAGES, SELECTORS } from './helpers/test-data';

test.describe('COD Module - Core Functional Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('TC001: Tạo Yêu Cầu COD Thành Công (Happy Path)', async ({ page }) => {
    console.log('🧪 Running TC001: Tạo Yêu Cầu COD Thành Công');
    
    // Step 1: Login as Dispatcher
    await authHelper.loginAsDispatcher();
    
    // Step 2: Navigate to Dispatcher page
    await page.goto('/dispatcher');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Find available container and click COD request
    const containerRow = page.locator(`text=${TEST_CONTAINERS[0].containerNumber}`).first();
    await expect(containerRow).toBeVisible();
    
    // Look for action menu button in the same row
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    
    // Click "Yêu cầu Đổi Nơi Trả"
    await page.click(SELECTORS.codRequestButton);
    
    // Step 4: Fill COD Request Dialog
    await page.waitForSelector(SELECTORS.citySelect);
    
    // Verify original container info is displayed
    await expect(page.locator('text=MSKU1234567')).toBeVisible();
    await expect(page.locator('text=ICD Sóng Thần')).toBeVisible();
    
    // Select new city
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    
    // Select new depot
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    
    // Enter reason
    await page.fill(SELECTORS.reasonInput, 'Tiện đường cho chuyến hàng tiếp theo');
    
    // Submit request
    await page.click(SELECTORS.submitButton);
    
    // Step 5: Verify results
    // Check toast message
    await expect(page.locator(SELECTORS.toast)).toContainText(TEST_MESSAGES.success.codRequestCreated);
    
    // Check container status changed
    await page.waitForTimeout(2000); // Wait for UI update
    await expect(page.locator('text=Chờ duyệt đổi nơi trả')).toBeVisible();
    
    console.log('✅ TC001 PASSED: COD request created successfully');
  });

  test('TC002: Carrier Admin Phê Duyệt COD Không Phí', async ({ page }) => {
    console.log('🧪 Running TC002: Carrier Admin Phê Duyệt COD Không Phí');
    
    // Pre-condition: Ensure there's a pending COD request
    // This would normally be set up in test data or previous test
    
    // Step 1: Login as Carrier Admin
    await authHelper.loginAsCarrierAdmin();
    
    // Step 2: Navigate to Carrier Admin page
    await page.goto('/carrier-admin');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Switch to COD tab
    await page.click(SELECTORS.codTab);
    
    // Step 4: Find pending request and approve
    const pendingRequest = page.locator(SELECTORS.pendingBadge).first();
    await expect(pendingRequest).toBeVisible();
    
    // Click action menu for the request
    const actionButton = pendingRequest.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    
    // Click approve
    await page.click(SELECTORS.approveButton);
    
    // Confirm approval
    await page.click('text=Xác nhận');
    
    // Step 5: Verify results
    await expect(page.locator(SELECTORS.toast)).toContainText(TEST_MESSAGES.success.codRequestApproved);
    
    // Request should disappear from pending list
    await page.waitForTimeout(2000);
    await expect(pendingRequest).not.toBeVisible();
    
    console.log('✅ TC002 PASSED: COD request approved successfully');
  });

  test('TC003: Carrier Admin Phê Duyệt COD Với Phí', async ({ page }) => {
    console.log('🧪 Running TC003: Carrier Admin Phê Duyệt COD Với Phí');
    
    await authHelper.loginAsCarrierAdmin();
    await page.goto('/carrier-admin');
    await page.click(SELECTORS.codTab);
    
    // Find pending request
    const pendingRequest = page.locator(SELECTORS.pendingBadge).first();
    await expect(pendingRequest).toBeVisible();
    
    // Click action menu
    const actionButton = pendingRequest.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    
    // Click approve with fee
    await page.click(SELECTORS.approveWithFeeButton);
    
    // Enter fee
    await page.fill(SELECTORS.feeInput, '200000');
    
    // Confirm
    await page.click('text=Xác nhận');
    
    // Verify success
    await expect(page.locator(SELECTORS.toast)).toContainText(TEST_MESSAGES.success.codRequestApproved);
    
    console.log('✅ TC003 PASSED: COD request approved with fee');
  });

  test('TC004: Carrier Admin Từ Chối COD', async ({ page }) => {
    console.log('🧪 Running TC004: Carrier Admin Từ Chối COD');
    
    await authHelper.loginAsCarrierAdmin();
    await page.goto('/carrier-admin');
    await page.click(SELECTORS.codTab);
    
    // Find pending request
    const pendingRequest = page.locator(SELECTORS.pendingBadge).first();
    await expect(pendingRequest).toBeVisible();
    
    // Click action menu
    const actionButton = pendingRequest.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    
    // Click decline
    await page.click(SELECTORS.declineButton);
    
    // Enter decline reason
    await page.fill(SELECTORS.declineReasonInput, 'Depot mới đang quá tải, không thể tiếp nhận thêm container');
    
    // Confirm
    await page.click('text=Xác nhận');
    
    // Verify success
    await expect(page.locator(SELECTORS.toast)).toContainText('Đã từ chối yêu cầu');
    
    console.log('✅ TC004 PASSED: COD request declined successfully');
  });

  test('TC005: Dispatcher Xem Trạng Thái COD Request', async ({ page }) => {
    console.log('🧪 Running TC005: Dispatcher Xem Trạng Thái COD Request');
    
    await authHelper.loginAsDispatcher();
    
    // Navigate to requests page
    await page.goto('/dispatcher/requests');
    await page.waitForLoadState('networkidle');
    
    // Switch to COD requests tab
    await page.click('text=Yêu cầu Đổi Nơi Trả');
    
    // Verify table headers
    await expect(page.locator('text=Số Container')).toBeVisible();
    await expect(page.locator('text=Nơi trả gốc')).toBeVisible();
    await expect(page.locator('text=Nơi trả mới')).toBeVisible();
    await expect(page.locator('text=Ngày gửi')).toBeVisible();
    
    // Verify status badges are displayed with correct colors
    const statusBadges = page.locator('[data-testid^="status-"]');
    await expect(statusBadges.first()).toBeVisible();
    
    console.log('✅ TC005 PASSED: COD request status displayed correctly');
  });

  test('TC006: Dispatcher Hủy COD Request (Đang PENDING)', async ({ page }) => {
    console.log('🧪 Running TC006: Dispatcher Hủy COD Request');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher/requests');
    
    // Switch to COD requests tab
    await page.click('text=Yêu cầu Đổi Nơi Trả');
    
    // Find pending request
    const pendingRequest = page.locator(SELECTORS.pendingBadge).first();
    await expect(pendingRequest).toBeVisible();
    
    // Click cancel button
    const cancelButton = pendingRequest.locator('..').locator('text=Hủy yêu cầu');
    await cancelButton.click();
    
    // Confirm cancellation
    await page.click('text=Xác nhận');
    
    // Verify success message
    await expect(page.locator(SELECTORS.toast)).toContainText(TEST_MESSAGES.success.codRequestCancelled);
    
    // Request should be removed
    await page.waitForTimeout(2000);
    await expect(pendingRequest).not.toBeVisible();
    
    console.log('✅ TC006 PASSED: COD request cancelled successfully');
  });
}); 