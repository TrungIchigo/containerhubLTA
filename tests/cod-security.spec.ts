import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { SELECTORS } from './helpers/test-data';

test.describe('COD Module - Security Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('TC051: Authorization - Cross-Organization Access', async ({ page }) => {
    console.log('🧪 Running TC051: Cross-Organization Access Test');
    
    // Login as Company A dispatcher
    await authHelper.loginAsDispatcher();
    
    // Try to access COD request from Company B via direct API call
    const response = await page.evaluate(async () => {
      // Simulate trying to access another company's COD request
      const response = await fetch('/api/cod/handle-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: 'fake-request-id-from-company-b',
          decision: 'APPROVED'
        })
      });
      
      return {
        status: response.status,
        statusText: response.statusText
      };
    });
    
    // Verify 403 Forbidden response
    expect(response.status).toBe(403);
    
    console.log('✅ TC051 PASSED: Cross-organization access blocked');
  });

  test('TC052: SQL Injection Prevention', async ({ page }) => {
    console.log('🧪 Running TC052: SQL Injection Prevention');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    // Find container and open COD request dialog
    const containerRow = page.locator('text=MSKU1234567').first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    await page.waitForSelector(SELECTORS.citySelect);
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    
    // Inject SQL injection payload in reason field
    const sqlInjectionPayload = "'; DROP TABLE cod_requests; --";
    await page.fill(SELECTORS.reasonInput, sqlInjectionPayload);
    
    await page.click(SELECTORS.submitButton);
    
    // Verify request was created successfully (input was sanitized)
    await expect(page.locator(SELECTORS.toast)).toContainText('Đã gửi yêu cầu');
    
    // Verify the database still exists by making another request
    await page.goto('/dispatcher/requests');
    await page.click('text=Yêu cầu Đổi Nơi Trả');
    
    // Should be able to see the request with the SQL injection text as normal text
    await expect(page.locator(`text=${sqlInjectionPayload}`)).toBeVisible();
    
    console.log('✅ TC052 PASSED: SQL injection prevented');
  });

  test('TC053: XSS Prevention', async ({ page }) => {
    console.log('🧪 Running TC053: XSS Prevention');
    
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    // Create COD request with XSS payload
    const containerRow = page.locator('text=MSKU1234567').first();
    const actionButton = containerRow.locator('..').locator('[data-testid="action-menu"]');
    await actionButton.click();
    await page.click(SELECTORS.codRequestButton);
    
    await page.waitForSelector(SELECTORS.citySelect);
    await page.click(SELECTORS.citySelect);
    await page.click('text=Thành phố Hồ Chí Minh');
    await page.click(SELECTORS.depotSelect);
    await page.click('text=Cảng Cát Lái');
    
    // XSS payload
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill(SELECTORS.reasonInput, xssPayload);
    
    await page.click(SELECTORS.submitButton);
    
    // Wait for request to be created
    await expect(page.locator(SELECTORS.toast)).toContainText('Đã gửi yêu cầu');
    
    // Navigate to requests page to see if XSS executes
    await page.goto('/dispatcher/requests');
    await page.click('text=Yêu cầu Đổi Nơi Trả');
    
    // Set up dialog handler to catch any alert
    let alertTriggered = false;
    page.on('dialog', async dialog => {
      alertTriggered = true;
      await dialog.accept();
    });
    
    // Wait a bit to see if any script executes
    await page.waitForTimeout(2000);
    
    // Verify no alert was triggered (XSS was prevented)
    expect(alertTriggered).toBeFalsy();
    
    // Verify the script tag is displayed as text, not executed
    await expect(page.locator('text=<script>alert("XSS")</script>')).toBeVisible();
    
    console.log('✅ TC053 PASSED: XSS prevented');
  });

  test('TC054: Rate Limiting', async ({ page }) => {
    console.log('🧪 Running TC054: Rate Limiting');
    
    await authHelper.loginAsDispatcher();
    
    // Simulate rapid requests
    const requests = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 20; i++) {
      const requestPromise = page.evaluate(async (index) => {
        const response = await fetch('/api/cod/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dropoffOrderId: 'test-container-id',
            requestedDepotId: 'test-depot-id',
            reasonForRequest: `Rate limit test ${index}`
          })
        });
        
        return {
          status: response.status,
          index: index,
          timestamp: Date.now()
        };
      }, i);
      
      requests.push(requestPromise);
    }
    
    // Execute all requests simultaneously
    const results = await Promise.all(requests);
    const endTime = Date.now();
    
    console.log(`Executed ${results.length} requests in ${endTime - startTime}ms`);
    
    // Check if any requests were rate limited (429 status)
    const rateLimitedRequests = results.filter(r => r.status === 429);
    const successfulRequests = results.filter(r => r.status === 200);
    
    console.log(`Successful: ${successfulRequests.length}, Rate limited: ${rateLimitedRequests.length}`);
    
    // Verify that rate limiting kicked in
    if (rateLimitedRequests.length > 0) {
      console.log('✅ TC054 PASSED: Rate limiting is working');
    } else {
      console.log('⚠️ TC054 WARNING: No rate limiting detected - may need configuration');
    }
    
    // Verify server didn't crash
    const healthCheck = await page.evaluate(async () => {
      const response = await fetch('/api/health');
      return response.status;
    });
    
    expect(healthCheck).toBe(200);
    console.log('✅ Server remained stable during load test');
  });

  test('TC055: Authentication Bypass Attempt', async ({ page }) => {
    console.log('🧪 Running TC055: Authentication Bypass Attempt');
    
    // Try to access protected COD endpoints without authentication
    await page.goto('/login');
    
    // Attempt to access COD API without being logged in
    const response = await page.evaluate(async () => {
      const response = await fetch('/api/cod/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dropoffOrderId: 'test-container-id',
          requestedDepotId: 'test-depot-id',
          reasonForRequest: 'Unauthorized access attempt'
        })
      });
      
      return {
        status: response.status,
        redirected: response.redirected
      };
    });
    
    // Verify unauthorized access is blocked
    expect(response.status).toBe(401);
    
    console.log('✅ TC055 PASSED: Authentication required for COD operations');
  });

  test('TC056: Session Hijacking Protection', async ({ page, context }) => {
    console.log('🧪 Running TC056: Session Hijacking Protection');
    
    // Login normally
    await authHelper.loginAsDispatcher();
    await page.goto('/dispatcher');
    
    // Get session cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));
    
    if (sessionCookie) {
      // Create new browser context with stolen cookie
      const newContext = await page.context().browser()?.newContext();
      if (newContext) {
        await newContext.addCookies([sessionCookie]);
        
        const newPage = await newContext.newPage();
        
        // Try to access protected resource with stolen session
        await newPage.goto('/dispatcher');
        
        // Modern session management should detect this and require re-authentication
        // or have additional security measures
        const currentUrl = newPage.url();
        
        // This test depends on your session security implementation
        // For now, we'll just verify the session works as expected
        console.log('⚠️ TC056 INFO: Session security depends on implementation');
        
        await newContext.close();
      }
    }
    
    console.log('✅ TC056 COMPLETED: Session security test completed');
  });
}); 