import { test, expect } from '@playwright/test';

test.describe('Container Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Login
    await page.fill('input[type="email"]', 'dispatcher.abc.26062025@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect to dashboard
    await page.waitForURL('http://localhost:3000/dispatcher');
    await page.waitForLoadState('networkidle');
    
    // Block image requests to avoid timeout
    await page.route('**/*.{png,jpg,jpeg}', route => route.abort());
    
    // Click the "+" button at bottom right
    const addButton = await page.waitForSelector('button[aria-label="Thêm mới"]', { timeout: 5000 });
    await addButton.click();
    
    // Wait for dropdown menu and click "Thêm lệnh giao trả"
    const addDropoffButton = await page.waitForSelector('button:has-text("Thêm lệnh giao trả")', { timeout: 5000 });
    await addDropoffButton.click();
    
    // Wait for the form dialog to appear
    await page.waitForSelector('div[role="dialog"]', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('form', { state: 'visible', timeout: 5000 });
    console.log('✅ Form dialog opened successfully');
  });

  test('CV-001: Should show warning for invalid ISO 6346 container number', async ({ page }) => {
    console.log('🧪 Running CV-001: Invalid ISO 6346 container number validation');

    // Test cases for invalid container numbers
    const invalidContainers = [
      'ABC1234567', // Wrong length
      '123ABCD123', // Invalid format
      'ABCU123456', // Invalid check digit
      'TEST123456', // Invalid owner code
      'MSCU1234567' // Too long
    ];

    for (const container of invalidContainers) {
      console.log(`📋 Testing container number: ${container}`);
      
      // Find and fill the container input
      const containerInput = await page.waitForSelector('input[name="container_number"]', { timeout: 5000 });
      await containerInput.evaluate(input => (input as HTMLInputElement).value = ''); // Clear using JS
      await containerInput.type(container, { delay: 50 }); // Type slower to ensure validation triggers
      
      // Wait for validation to trigger automatically after typing
      await page.waitForTimeout(1000);

      // Check if warning message appears
      const warningElement = page.locator('text=Số container không đúng định dạng ISO 6346');
      const isVisible = await warningElement.isVisible();
      console.log(`Warning visible after typing: ${isVisible}`);

      // If not visible after typing, try blur to trigger validation
      if (!isVisible) {
        await containerInput.evaluate(input => input.blur());
        await page.waitForTimeout(1000);
        const isVisibleAfterBlur = await warningElement.isVisible();
        console.log(`Warning visible after blur: ${isVisibleAfterBlur}`);
        expect(isVisibleAfterBlur).toBeTruthy();
      } else {
        expect(isVisible).toBeTruthy();
      }
      
      console.log('✅ Warning message displayed correctly');
    }

    console.log('✅ CV-001 PASSED: Invalid container numbers show warnings');
  });

  test('CV-002: Should accept valid ISO 6346 container numbers', async ({ page }) => {
    console.log('🧪 Running CV-002: Valid ISO 6346 container number validation');

    // Test cases for valid container numbers
    const validContainers = [
      'MSCU1234560',
      'TRIU9876543',
      'CSQU3456789'
    ];

    for (const container of validContainers) {
      console.log(`📋 Testing container number: ${container}`);
      
      // Find and fill the container input
      const containerInput = await page.waitForSelector('input[name="container_number"]', { timeout: 5000 });
      await containerInput.evaluate(input => (input as HTMLInputElement).value = ''); // Clear using JS
      await containerInput.type(container, { delay: 50 }); // Type slower to ensure validation triggers
      
      // Wait for validation to trigger automatically after typing
      await page.waitForTimeout(1000);

      // Check that no warning message appears
      const warningElement = page.locator('text=Số container không đúng định dạng ISO 6346');
      const isVisible = await warningElement.isVisible();
      console.log(`Warning visible after typing: ${isVisible}`);

      // If visible, try blur to see if it goes away
      if (isVisible) {
        await containerInput.evaluate(input => input.blur());
        await page.waitForTimeout(1000);
        const isVisibleAfterBlur = await warningElement.isVisible();
        console.log(`Warning visible after blur: ${isVisibleAfterBlur}`);
        expect(isVisibleAfterBlur).toBeFalsy();
      } else {
        expect(isVisible).toBeFalsy();
      }
      
      console.log('✅ No warning message displayed as expected');
    }

    console.log('✅ CV-002 PASSED: Valid container numbers show no warnings');
  });

  test('CV-003: Should show warning for duplicate container numbers', async ({ page }) => {
    console.log('🧪 Running CV-003: Duplicate container number validation');

    const containerNumber = 'MSCU1234560';
    console.log(`📋 Testing duplicate container: ${containerNumber}`);

    // First, add a container
    const containerInput = await page.waitForSelector('input[name="container_number"]', { timeout: 5000 });
    await containerInput.type(containerNumber, { delay: 50 }); // Type slower to ensure validation triggers
    
    // Wait for validation to trigger automatically after typing
    await page.waitForTimeout(1000);
    
    // Fill other required fields
    await page.selectOption('select[name="container_type_id"]', { index: 1 });
    await page.selectOption('select[name="cargo_type_id"]', { index: 1 });
    await page.selectOption('select[name="city_id"]', { index: 1 });
    await page.selectOption('select[name="depot_id"]', { index: 1 });
    await page.fill('input[name="available_from_datetime"]', '2024-12-31T12:00');
    await page.selectOption('select[name="shipping_line_org_id"]', { index: 1 });

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000); // Wait for submission

    // Click the "+" button at bottom right again
    const addButton = await page.waitForSelector('button[aria-label="Thêm mới"]', { timeout: 5000 });
    await addButton.click();
    
    // Wait for dropdown menu and click "Thêm lệnh giao trả"
    const addDropoffButton = await page.waitForSelector('button:has-text("Thêm lệnh giao trả")', { timeout: 5000 });
    await addDropoffButton.click();
    
    // Wait for the form dialog to appear
    await page.waitForSelector('div[role="dialog"]', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('form', { state: 'visible', timeout: 5000 });

    // Try to add the same container again
    const newContainerInput = await page.waitForSelector('input[name="container_number"]', { timeout: 5000 });
    await newContainerInput.type(containerNumber, { delay: 50 }); // Type slower to ensure validation triggers
    
    // Wait for validation to trigger automatically after typing
    await page.waitForTimeout(1000);

    // Check for duplicate warning
    const duplicateWarning = page.locator('text=Số container này đã tồn tại trong hệ thống');
    const isVisible = await duplicateWarning.isVisible();
    console.log(`Duplicate warning visible after typing: ${isVisible}`);

    // If not visible after typing, try blur
    if (!isVisible) {
      await newContainerInput.evaluate(input => input.blur());
      await page.waitForTimeout(1000);
      const isVisibleAfterBlur = await duplicateWarning.isVisible();
      console.log(`Duplicate warning visible after blur: ${isVisibleAfterBlur}`);
      expect(isVisibleAfterBlur).toBeTruthy();
    } else {
      expect(isVisible).toBeTruthy();
    }
    
    console.log('✅ Duplicate warning displayed correctly');
    console.log('✅ CV-003 PASSED: Duplicate container numbers show warnings');
  });
}); 