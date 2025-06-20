'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  Transaction, 
  Invoice, 
  TransactionType, 
  CreateInvoiceRequest,
  BillingStats,
  OrganizationBillingSummary 
} from '@/lib/types/billing';

const SERVICE_FEE = 20000; // Phí dịch vụ mặc định - có thể di chuyển vào config

/**
 * Tạo giao dịch mới trong hệ thống
 */
export async function createTransaction(
  payerOrgId: string,
  relatedRequestId: string | null,
  transactionType: TransactionType,
  amount: number,
  description: string
) {
  try {
    console.log('createTransaction called with:', {
      payerOrgId,
      relatedRequestId,
      transactionType,
      amount,
      description
    });

    const supabase = await createClient();

    const transactionData = {
      payer_org_id: payerOrgId,
      related_request_id: relatedRequestId,
      transaction_type: transactionType,
      amount,
      description,
      status: 'UNPAID'
    };

    console.log('Inserting transaction data:', transactionData);

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating transaction:', error);
      return { success: false, error: error.message };
    }

    console.log('Transaction created successfully:', data);
    
    // Revalidate billing pages after creating transaction
    revalidatePath('/billing');
    revalidatePath('/admin/billing');
    
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error creating transaction:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Tạo phí dịch vụ COD
 */
export async function createCodServiceFee(
  payerOrgId: string,
  codRequestId: string,
  containerNumber?: string
) {
  console.log('createCodServiceFee called with:', {
    payerOrgId,
    codRequestId,
    containerNumber,
    SERVICE_FEE
  });

  const description = containerNumber 
    ? `Phí dịch vụ xử lý yêu cầu COD cho container ${containerNumber}`
    : `Phí dịch vụ xử lý yêu cầu COD`;

  console.log('Creating COD transaction with description:', description);

  const result = await createTransaction(
    payerOrgId,
    codRequestId,
    'COD_SERVICE_FEE',
    SERVICE_FEE,
    description
  );

  console.log('COD transaction creation result:', result);
  return result;
}

/**
 * Tạo phí giao dịch marketplace
 */
export async function createMarketplaceFee(
  payerOrgId: string,
  streetTurnRequestId: string
) {
  return await createTransaction(
    payerOrgId,
    streetTurnRequestId,
    'MARKETPLACE_FEE',
    SERVICE_FEE,
    'Phí giao dịch thành công trên Thị trường'
  );
}

/**
 * Lấy danh sách giao dịch chưa xuất hóa đơn
 */
export async function getUnpaidTransactions(organizationId?: string) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(`
        *,
        payer_organization:organizations!payer_org_id(
          id,
          name,
          organization_type
        )
      `)
      .eq('status', 'UNPAID')
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('payer_org_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching unpaid transactions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Transaction[] };
  } catch (error) {
    console.error('Unexpected error fetching unpaid transactions:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Tạo hóa đơn cho một tổ chức
 */
export async function createInvoiceForOrganization(request: CreateInvoiceRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('create_invoice_for_organization', {
      org_id: request.organization_id,
      period_start_date: request.period_start,
      period_end_date: request.period_end
    });

    if (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Không có giao dịch nào cần tạo hóa đơn trong khoảng thời gian này' };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/billing');
    return { success: true, invoiceId: data };
  } catch (error) {
    console.error('Unexpected error creating invoice:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Đánh dấu hóa đơn đã thanh toán
 */
export async function markInvoiceAsPaid(invoiceId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('mark_invoice_as_paid', {
      invoice_id: invoiceId
    });

    if (error) {
      console.error('Error marking invoice as paid:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Không tìm thấy hóa đơn hoặc không thể cập nhật' };
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/billing');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error marking invoice as paid:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Lấy danh sách hóa đơn
 */
export async function getInvoices(organizationId?: string) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('invoices')
      .select(`
        *,
        organization:organizations!organization_id(
          id,
          name,
          organization_type
        ),
        transactions(
          id,
          amount,
          transaction_type,
          description,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Invoice[] };
  } catch (error) {
    console.error('Unexpected error fetching invoices:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Lấy thống kê billing
 */
export async function getBillingStats(): Promise<{ success: boolean; data?: BillingStats; error?: string }> {
  try {
    const supabase = await createClient();

    // Lấy thống kê giao dịch
    const { data: transactionStats, error: transactionError } = await supabase
      .from('transactions')
      .select('status, amount')
      .not('status', 'eq', 'CANCELLED');

    if (transactionError) {
      throw transactionError;
    }

    // Lấy thống kê hóa đơn
    const { data: invoiceStats, error: invoiceError } = await supabase
      .from('invoices')
      .select('status, due_date')
      .not('status', 'eq', 'CANCELLED');

    if (invoiceError) {
      throw invoiceError;
    }

    const stats: BillingStats = {
      total_transactions: transactionStats.length,
      total_amount: transactionStats.reduce((sum, t) => sum + Number(t.amount), 0),
      unpaid_amount: transactionStats
        .filter(t => t.status === 'UNPAID')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      invoiced_amount: transactionStats
        .filter(t => t.status === 'INVOICED')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      paid_amount: transactionStats
        .filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      pending_invoices: invoiceStats.filter(i => i.status === 'PENDING').length,
      overdue_invoices: invoiceStats.filter(i => 
        i.status === 'PENDING' && new Date(i.due_date) < new Date()
      ).length
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Unexpected error fetching billing stats:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Lấy tóm tắt billing theo tổ chức
 */
export async function getOrganizationBillingSummary(): Promise<{ 
  success: boolean; 
  data?: OrganizationBillingSummary[]; 
  error?: string 
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        payer_org_id,
        amount,
        status,
        created_at,
        payer_organization:organizations!payer_org_id(
          id,
          name
        )
      `)
      .not('status', 'eq', 'CANCELLED');

    if (error) {
      throw error;
    }

    // Lấy thông tin về hóa đơn cuối cùng
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('organization_id, issue_date, payment_date, status')
      .order('issue_date', { ascending: false });

    if (invoiceError) {
      throw invoiceError;
    }

    // Tổng hợp dữ liệu theo tổ chức
    const orgMap = new Map<string, OrganizationBillingSummary>();

    data.forEach(transaction => {
      const orgId = transaction.payer_org_id;
      const orgName = Array.isArray(transaction.payer_organization) 
        ? transaction.payer_organization[0]?.name || 'Unknown'
        : (transaction.payer_organization as any)?.name || 'Unknown';
      
      if (!orgMap.has(orgId)) {
        orgMap.set(orgId, {
          organization_id: orgId,
          organization_name: orgName,
          total_transactions: 0,
          total_amount: 0,
          unpaid_amount: 0
        });
      }

      const summary = orgMap.get(orgId)!;
      summary.total_transactions++;
      summary.total_amount += Number(transaction.amount);
      
      if (transaction.status === 'UNPAID') {
        summary.unpaid_amount += Number(transaction.amount);
      }
    });

    // Thêm thông tin hóa đơn
    invoiceData.forEach(invoice => {
      const orgId = invoice.organization_id;
      const summary = orgMap.get(orgId);
      
      if (summary) {
        if (!summary.last_invoice_date || invoice.issue_date > summary.last_invoice_date) {
          summary.last_invoice_date = invoice.issue_date;
        }
        
        if (invoice.payment_date && 
            (!summary.last_payment_date || invoice.payment_date > summary.last_payment_date)) {
          summary.last_payment_date = invoice.payment_date;
        }
      }
    });

    return { success: true, data: Array.from(orgMap.values()) };
  } catch (error) {
    console.error('Unexpected error fetching organization billing summary:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
} 