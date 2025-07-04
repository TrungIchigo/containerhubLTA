export interface TestUser {
  email: string;
  password: string;
  role: 'dispatcher' | 'carrier_admin';
  organization: string;
}

export interface TestContainer {
  containerNumber: string;
  status: string;
  currentDepot: string;
  targetDepot: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  dispatcher: {
    email: 'dispatcher@test.com',
    password: 'test123456',
    role: 'dispatcher',
    organization: 'Công ty Vận tải ABC'
  },
  carrierAdmin: {
    email: 'carrier@test.com', 
    password: 'test123456',
    role: 'carrier_admin',
    organization: 'Hãng tàu Maersk'
  }
};

export const TEST_CONTAINERS: TestContainer[] = [
  {
    containerNumber: 'MSKU1234567',
    status: 'AVAILABLE',
    currentDepot: 'ICD Sóng Thần',
    targetDepot: 'Cảng Cát Lái'
  },
  {
    containerNumber: 'MSKU7654321',
    status: 'AVAILABLE', 
    currentDepot: 'Cảng Cát Lái',
    targetDepot: 'ICD Sóng Thần'
  }
];

export const TEST_MESSAGES = {
  success: {
    codRequestCreated: 'Đã gửi yêu cầu thay đổi nơi giao trả thành công!',
    codRequestApproved: 'Đã phê duyệt yêu cầu thành công.',
    codRequestCancelled: 'Đã hủy yêu cầu thành công'
  },
  error: {
    containerNotAvailable: 'Thao tác không thể thực hiện. Container này không ở trạng thái sẵn sàng',
    requestAlreadyProcessed: 'Thao tác không thể thực hiện. Yêu cầu này đã được xử lý'
  }
};

export const SELECTORS = {
  // Login
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]', 
  loginButton: '[data-testid="login-button"]',
  
  // Navigation
  dispatcherNav: '[data-testid="dispatcher-nav"]',
  carrierAdminNav: '[data-testid="carrier-admin-nav"]',
  requestsTab: '[data-testid="requests-tab"]',
  codTab: '[data-testid="cod-tab"]',
  
  // COD Request Dialog
  codRequestButton: '[data-testid="cod-request-button"]',
  citySelect: '[data-testid="city-select"]',
  depotSelect: '[data-testid="depot-select"]',
  reasonInput: '[data-testid="reason-input"]',
  submitButton: '[data-testid="submit-button"]',
  
  // COD Management
  approveButton: '[data-testid="approve-button"]',
  approveWithFeeButton: '[data-testid="approve-with-fee-button"]',
  declineButton: '[data-testid="decline-button"]',
  feeInput: '[data-testid="fee-input"]',
  declineReasonInput: '[data-testid="decline-reason-input"]',
  
  // Status badges
  pendingBadge: '[data-testid="status-pending"]',
  approvedBadge: '[data-testid="status-approved"]',
  declinedBadge: '[data-testid="status-declined"]',
  
  // Toast messages
  toast: '[data-testid="toast"]',
  toastMessage: '[data-testid="toast-message"]'
}; 