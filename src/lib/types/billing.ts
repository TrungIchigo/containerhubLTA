export type TransactionStatus = 'UNPAID' | 'INVOICED' | 'PAID' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type TransactionType = 'COD_SERVICE_FEE' | 'MARKETPLACE_FEE';

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
    organization_type: string;
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
    organization_type: string;
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