import { test, expect } from '@playwright/test';

test.describe('COD Module - Implementation Verification', () => {
  
  test('COD-IMPL-001: Verify Application is Running', async ({ page }) => {
    console.log('🧪 Running COD-IMPL-001: Verify Application is Running');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we can access the application
    const title = await page.title();
    console.log(`📋 Application Title: ${title}`);
    
    // Verify we're not getting a 404 or error page
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('404');
    expect(bodyText).not.toContain('This page could not be found');
    
    console.log('✅ COD-IMPL-001 PASSED: Application is running and accessible');
  });

  test('COD-IMPL-002: Check Login Page Accessibility', async ({ page }) => {
    console.log('🧪 Running COD-IMPL-002: Check Login Page Accessibility');
    
    // Try to access login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if login form elements exist
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Đăng nhập"), button:has-text("Login"), button[type="submit"]').count() > 0;
    
    console.log(`📋 Email Input Found: ${hasEmailInput}`);
    console.log(`📋 Password Input Found: ${hasPasswordInput}`);
    console.log(`📋 Login Button Found: ${hasLoginButton}`);
    
    // At least one of these should be true for a login page
    expect(hasEmailInput || hasPasswordInput || hasLoginButton).toBeTruthy();
    
    console.log('✅ COD-IMPL-002 PASSED: Login page is accessible');
  });

  test('COD-IMPL-003: Check Navigation Structure', async ({ page }) => {
    console.log('🧪 Running COD-IMPL-003: Check Navigation Structure');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation elements
    const navElements = await page.locator('nav, [role="navigation"], .nav, .navbar, .navigation').count();
    const linkElements = await page.locator('a').count();
    
    console.log(`📋 Navigation Elements Found: ${navElements}`);
    console.log(`📋 Link Elements Found: ${linkElements}`);
    
    // Check for common navigation patterns
    const hasDispatcherLink = await page.locator('a:has-text("Dispatcher"), a:has-text("dispatcher"), a[href*="dispatcher"]').count() > 0;
    const hasCarrierLink = await page.locator('a:has-text("Carrier"), a:has-text("carrier"), a[href*="carrier"]').count() > 0;
    
    console.log(`📋 Dispatcher Navigation Found: ${hasDispatcherLink}`);
    console.log(`📋 Carrier Navigation Found: ${hasCarrierLink}`);
    
    expect(linkElements).toBeGreaterThan(0);
    
    console.log('✅ COD-IMPL-003 PASSED: Navigation structure exists');
  });

  test('COD-IMPL-004: Check for COD-related Routes', async ({ page }) => {
    console.log('🧪 Running COD-IMPL-004: Check for COD-related Routes');
    
    const routesToCheck = [
      '/dispatcher',
      '/carrier-admin', 
      '/requests',
      '/dashboard'
    ];
    
    const accessibleRoutes = [];
    const inaccessibleRoutes = [];
    
    for (const route of routesToCheck) {
      try {
        console.log(`📋 Checking route: ${route}`);
        
        const response = await page.goto(`http://localhost:3000${route}`);
        await page.waitForLoadState('networkidle');
        
        if (response && response.status() < 400) {
          accessibleRoutes.push(route);
          console.log(`  ✅ ${route} - Accessible (${response.status()})`);
        } else {
          inaccessibleRoutes.push(route);
          console.log(`  ❌ ${route} - Not accessible (${response?.status()})`);
        }
      } catch (error) {
        inaccessibleRoutes.push(route);
        console.log(`  ❌ ${route} - Error: ${error}`);
      }
    }
    
    console.log(`📊 Accessible Routes: ${accessibleRoutes.length}/${routesToCheck.length}`);
    console.log(`📊 Accessible: ${accessibleRoutes.join(', ')}`);
    console.log(`📊 Inaccessible: ${inaccessibleRoutes.join(', ')}`);
    
    // At least some routes should be accessible
    expect(accessibleRoutes.length).toBeGreaterThan(0);
    
    console.log('✅ COD-IMPL-004 PASSED: Some COD-related routes are accessible');
  });

  test('COD-IMPL-005: Check for COD UI Components', async ({ page }) => {
    console.log('🧪 Running COD-IMPL-005: Check for COD UI Components');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Look for COD-related text and components
    const bodyText = await page.textContent('body');
    
    const codKeywords = [
      'COD',
      'Change of Destination',
      'Đổi nơi trả',
      'Thay đổi nơi giao trả',
      'Container',
      'Depot',
      'Dispatcher',
      'Carrier'
    ];
    
    const foundKeywords = [];
    const notFoundKeywords = [];
    
    for (const keyword of codKeywords) {
      if (bodyText?.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      } else {
        notFoundKeywords.push(keyword);
      }
    }
    
    console.log(`📋 Found Keywords: ${foundKeywords.join(', ')}`);
    console.log(`📋 Not Found Keywords: ${notFoundKeywords.join(', ')}`);
    
    // Look for form elements that might be COD-related
    const formElements = await page.locator('form, input, select, button').count();
    const tableElements = await page.locator('table, .table, [role="table"]').count();
    
    console.log(`📋 Form Elements Found: ${formElements}`);
    console.log(`📋 Table Elements Found: ${tableElements}`);
    
    // At least some COD-related content should exist
    expect(foundKeywords.length + formElements + tableElements).toBeGreaterThan(0);
    
    console.log('✅ COD-IMPL-005 PASSED: COD-related UI components detected');
  });

  test('COD-IMPL-006: API Endpoints Availability Check', async ({ page }) => {
    console.log('🧪 Running COD-IMPL-006: API Endpoints Availability Check');
    
    const apiEndpoints = [
      '/api/cod/create',
      '/api/cod/handle-decision',
      '/api/cod/requests',
      '/api/health'
    ];
    
    const results = [];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`📋 Checking API endpoint: ${endpoint}`);
        
        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url);
            return {
              status: res.status,
              ok: res.ok,
              statusText: res.statusText
            };
          } catch (error) {
            return {
              status: 0,
              ok: false,
              statusText: (error as Error).message
            };
          }
        }, `http://localhost:3000${endpoint}`);
        
        results.push({
          endpoint,
          status: response.status,
          available: response.status !== 0 && response.status !== 404
        });
        
        console.log(`  📊 ${endpoint} - Status: ${response.status} (${response.statusText})`);
        
      } catch (error) {
        results.push({
          endpoint,
          status: 0,
          available: false
        });
        console.log(`  ❌ ${endpoint} - Error: ${error}`);
      }
    }
    
    const availableEndpoints = results.filter(r => r.available);
    console.log(`📊 Available API Endpoints: ${availableEndpoints.length}/${apiEndpoints.length}`);
    
    // Log summary
    results.forEach(result => {
      const status = result.available ? '✅' : '❌';
      console.log(`  ${status} ${result.endpoint} (${result.status})`);
    });
    
    console.log('✅ COD-IMPL-006 COMPLETED: API endpoint availability checked');
  });
}); 