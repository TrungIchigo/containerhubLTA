export type TransactionStatus = 'UNPAID' | 'INVOICED' | 'PAID' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type TransactionType = 'COD_SERVICE_FEE' | 'MARKETPLACE_FEE';

// Prepaid Fund Types
export type FundTransactionType = 'TOP_UP' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
export type FundTransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
export type QRPurpose = 'TOP_UP' | 'COD_PAYMENT';

export interface Transaction {
  id: string;
  payer_org_id: string;
  related_request_id?: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  status: TransactionStatus;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  payer_organization?: {
    id: string;
    name: string;
    type: string;
  };
  invoice?: Invoice;
}

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  // Relations
  organization?: {
    id: string;
    name: string;
    type: string;
  };
  transactions?: Transaction[];
}

export interface CreateInvoiceRequest {
  organization_id: string;
  period_start: string;
  period_end: string;
}

export interface BillingStats {
  total_transactions: number;
  total_amount: number;
  unpaid_amount: number;
  invoiced_amount: number;
  paid_amount: number;
  pending_invoices: number;
  overdue_invoices: number;
}

export interface OrganizationBillingSummary {
  organization_id: string;
  organization_name: string;
  total_transactions: number;
  total_amount: number;
  unpaid_amount: number;
  last_invoice_date?: string;
  last_payment_date?: string;
}

// Prepaid Fund Interfaces
export interface PrepaidFund {
  id: string;
  organization_id: string;
  balance: number;
  currency: string;
  fund_code: string;
  fund_name: string;
  daily_topup_limit: number;
  monthly_topup_limit: number;
  total_topped_up: number;
  total_spent: number;
  last_topup_at?: string;
  last_payment_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FundTransaction {
  id: string;
  fund_id: string;
  transaction_type: FundTransactionType;
  amount: number;
  currency: string;
  status: FundTransactionStatus;
  description?: string;
  reference_id?: string;
  bank_transaction_id?: string;
  bank_reference?: string;
  payment_method?: string;
  balance_before: number;
  balance_after: number;
  created_by?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentQRCode {
  id: string;
  qr_code_data: string;
  qr_purpose: QRPurpose;
  amount: number;
  currency: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  transfer_content: string;
  organization_id: string;
  related_fund_id?: string;
  related_cod_request_id?: string;
  related_transaction_id?: string;
  is_active: boolean;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

// COD Payment Related Types
export interface CodPaymentRequest {
  cod_request_id: string;
  amount: number;
  payment_method: 'PREPAID_FUND' | 'BANK_TRANSFER';
  description?: string;
}

export interface PendingCodPayment {
  id: string;
  status: string;
  cod_fee: number;
  delivery_confirmed_at: string;
  container_number: string;
  requesting_org_name: string;
  original_depot_address?: string;
  requested_depot_name?: string;
  created_at: string;
}

// API Response Types
export interface BillingResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface FundResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface QRCodeResult {
  success: boolean;
  data?: {
    qr_id: string;
    qr_data: string;
    transfer_content: string;
    expires_at: string;
    amount: number;
    account_number: string;
    account_name: string;
  };
  message?: string;
  error?: string;
} 