import { Page } from '@playwright/test';
import { TEST_USERS, SELECTORS } from './test-data';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAsDispatcher() {
    await this.login(TEST_USERS.dispatcher);
  }

  async loginAsCarrierAdmin() {
    await this.login(TEST_USERS.carrierAdmin);
  }

  private async login(user: typeof TEST_USERS.dispatcher) {
    await this.page.goto('/login');
    
    // Wait for login form to be visible
    await this.page.waitForSelector(SELECTORS.emailInput);
    
    // Fill login form
    await this.page.fill(SELECTORS.emailInput, user.email);
    await this.page.fill(SELECTORS.passwordInput, user.password);
    
    // Submit login
    await this.page.click(SELECTORS.loginButton);
    
    // Wait for redirect after successful login
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  }

  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/login');
  }

  async ensureLoggedOut() {
    try {
      // Try to go to a protected page
      await this.page.goto('/dashboard');
      
      // If we're redirected to login, we're already logged out
      await this.page.waitForURL('**/login', { timeout: 3000 });
    } catch {
      // If we're not redirected, we need to logout
      await this.logout();
    }
  }
} 