'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// Types
export interface PrepaidFund {
  id: string;
  organization_id: string;
  balance: number;
  currency: string;
  fund_code: string;
  fund_name: string;
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
  transaction_type: 'TOP_UP' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  description?: string;
  reference_id?: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  updated_at: string;
}

export interface QRCodeInfo {
  id: string;
  qr_data: string;
  transfer_content: string;
  expires_at: string;
  amount: number;
  account_number: string;
  account_name: string;
}

export interface FundResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Lấy thông tin quỹ prepaid của organization hiện tại
 */
export async function getPrepaidFund(): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.profile?.organization_id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập hoặc chưa có organization.'
      };
    }

    const supabase = await createClient();

    const { data: fund, error } = await supabase
      .from('organization_prepaid_funds')
      .select('*')
      .eq('organization_id', user.profile.organization_id)
      .single();

    if (error) {
      console.error('Error fetching prepaid fund:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: fund as PrepaidFund
    };
  } catch (error) {
    console.error('Unexpected error in getPrepaidFund:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi lấy thông tin quỹ.'
    };
  }
}

/**
 * DEBUG: Lấy thông tin quỹ prepaid với organization_id cụ thể
 */
export async function getDebugPrepaidFund(organizationId: string): Promise<FundResult> {
  try {
    const supabase = await createClient();

    const { data: fund, error } = await supabase
      .from('organization_prepaid_funds')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching debug prepaid fund:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!fund) {
      return {
        success: false,
        message: 'Không tìm thấy quỹ prepaid cho organization này.'
      };
    }

    return {
      success: true,
      data: fund as PrepaidFund
    };
  } catch (error) {
    console.error('Unexpected error in getDebugPrepaidFund:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi lấy thông tin quỹ debug.'
    };
  }
}

/**
 * Lấy lịch sử giao dịch quỹ
 */
export async function getFundTransactions(limit: number = 10): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.profile?.organization_id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập hoặc chưa có organization.'
      };
    }

    const supabase = await createClient();

    // Lấy fund ID trước
    const { data: fund, error: fundError } = await supabase
      .from('organization_prepaid_funds')
      .select('id')
      .eq('organization_id', user.profile.organization_id)
      .single();

    if (fundError || !fund) {
      return {
        success: false,
        message: 'Không tìm thấy quỹ prepaid.'
      };
    }

    const { data: transactions, error } = await supabase
      .from('fund_transactions')
      .select('*')
      .eq('fund_id', fund.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching fund transactions:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: transactions as FundTransaction[]
    };
  } catch (error) {
    console.error('Unexpected error in getFundTransactions:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi lấy lịch sử giao dịch.'
    };
  }
}

/**
 * Tạo QR code cho nạp tiền
 */
export async function generateTopUpQR(amount: number): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.profile?.organization_id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập hoặc chưa có organization.'
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        message: 'Số tiền nạp phải lớn hơn 0.'
      };
    }

    const supabase = await createClient();

    const { data: qrInfo, error } = await supabase
      .rpc('generate_vietqr_code', {
        p_organization_id: user.profile.organization_id,
        p_amount: amount,
        p_purpose: 'TOP_UP'
      });

    if (error) {
      console.error('Error generating top-up QR:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!qrInfo || qrInfo.length === 0) {
      return {
        success: false,
        message: 'Không thể tạo mã QR. Vui lòng thử lại.'
      };
    }

    return {
      success: true,
      data: qrInfo[0] as QRCodeInfo
    };
  } catch (error) {
    console.error('Unexpected error in generateTopUpQR:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi tạo mã QR nạp tiền.'
    };
  }
}

/**
 * Tạo QR code cho thanh toán COD
 */
export async function generateCodPaymentQR(amount: number, codRequestId: string): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.profile?.organization_id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập hoặc chưa có organization.'
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0.'
      };
    }

    const supabase = await createClient();

    const { data: qrInfo, error } = await supabase
      .rpc('generate_vietqr_code', {
        p_organization_id: user.profile.organization_id,
        p_amount: amount,
        p_purpose: 'COD_PAYMENT',
        p_cod_request_id: codRequestId
      });

    if (error) {
      console.error('Error generating COD payment QR:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!qrInfo || qrInfo.length === 0) {
      return {
        success: false,
        message: 'Không thể tạo mã QR thanh toán. Vui lòng thử lại.'
      };
    }

    return {
      success: true,
      data: qrInfo[0] as QRCodeInfo
    };
  } catch (error) {
    console.error('Unexpected error in generateCodPaymentQR:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi tạo mã QR thanh toán COD.'
    };
  }
}

/**
 * DEBUG: Tạo mã QR thanh toán COD với organization_id cụ thể
 */
export async function generateDebugCodPaymentQR(
  organizationId: string,
  amount: number,
  codRequestId: string
): Promise<FundResult> {
  try {
    if (amount <= 0) {
      return {
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0.'
      };
    }

    const supabase = await createClient();

    const { data: qrInfo, error } = await supabase
      .rpc('generate_vietqr_code', {
        p_organization_id: organizationId,
        p_amount: amount,
        p_purpose: 'COD_PAYMENT',
        p_cod_request_id: codRequestId
      });

    if (error) {
      console.error('Error generating debug COD payment QR:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!qrInfo || qrInfo.length === 0) {
      return {
        success: false,
        message: 'Không thể tạo mã QR thanh toán debug. Vui lòng thử lại.'
      };
    }

    return {
      success: true,
      data: qrInfo[0] as QRCodeInfo
    };
  } catch (error) {
    console.error('Unexpected error in generateDebugCodPaymentQR:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi tạo mã QR thanh toán COD debug.'
    };
  }
}

/**
 * Xử lý thanh toán COD bằng quỹ prepaid
 */
export async function processPaymentWithFund(
  codRequestId: string,
  amount: number,
  description?: string
): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      return {
        success: false,
        message: 'Chỉ Dispatcher mới có thể thực hiện thanh toán.'
      };
    }

    const supabase = await createClient();

    // Lấy thông tin quỹ
    const { data: fund, error: fundError } = await supabase
      .from('organization_prepaid_funds')
      .select('id, balance')
      .eq('organization_id', user.profile.organization_id)
      .single();

    if (fundError || !fund) {
      return {
        success: false,
        message: 'Không tìm thấy quỹ prepaid của công ty.'
      };
    }

    // Kiểm tra số dư
    if (fund.balance < amount) {
      return {
        success: false,
        message: `Số dư không đủ. Số dư hiện tại: ${fund.balance.toLocaleString('vi-VN')} VNĐ, cần: ${amount.toLocaleString('vi-VN')} VNĐ`
      };
    }

    // Xử lý giao dịch thanh toán
    const { data: transactionId, error: txError } = await supabase
      .rpc('process_fund_transaction', {
        p_fund_id: fund.id,
        p_transaction_type: 'PAYMENT',
        p_amount: amount,
        p_description: description || `Thanh toán phí COD cho yêu cầu ${codRequestId}`,
        p_reference_id: codRequestId,
        p_created_by: user.id
      });

    if (txError) {
      console.error('Error processing payment transaction:', txError);
      return {
        success: false,
        error: txError.message
      };
    }

    // Cập nhật trạng thái COD request thành PAID
    const { error: codError } = await supabase
      .from('cod_requests')
      .update({
        status: 'PAID',
        payment_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', codRequestId);

    if (codError) {
      console.error('Error updating COD request status:', codError);
      // Rollback giao dịch nếu có thể (cần implement rollback logic)
      return {
        success: false,
        error: 'Có lỗi khi cập nhật trạng thái yêu cầu COD.'
      };
    }

    // Revalidate relevant pages
    revalidatePath('/billing');
    revalidatePath('/dispatcher/requests');

    return {
      success: true,
      message: 'Thanh toán thành công!',
      data: { transactionId }
    };
  } catch (error) {
    console.error('Unexpected error in processPaymentWithFund:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi xử lý thanh toán.'
    };
  }
}

/**
 * Xác nhận đã nạp tiền (được gọi sau khi user chuyển khoản)
 */
export async function confirmTopUpTransfer(
  qrId: string,
  bankTransactionId?: string
): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.profile?.organization_id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập hoặc chưa có organization.'
      };
    }

    const supabase = await createClient();

    // Lấy thông tin QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('payment_qr_codes')
      .select('*')
      .eq('id', qrId)
      .eq('organization_id', user.profile.organization_id)
      .eq('qr_purpose', 'TOP_UP')
      .single();

    if (qrError || !qrCode) {
      return {
        success: false,
        message: 'Mã QR không hợp lệ hoặc đã hết hạn.'
      };
    }

    // Kiểm tra QR code còn hiệu lực
    if (new Date(qrCode.expires_at) < new Date()) {
      return {
        success: false,
        message: 'Mã QR đã hết hạn. Vui lòng tạo mã QR mới.'
      };
    }

    if (qrCode.used_at) {
      return {
        success: false,
        message: 'Mã QR này đã được sử dụng.'
      };
    }

    // Tạo giao dịch nạp tiền với trạng thái PENDING (chờ admin xác nhận)
    const { data: transactionId, error: txError } = await supabase
      .from('fund_transactions')
      .insert({
        fund_id: qrCode.related_fund_id,
        transaction_type: 'TOP_UP',
        amount: qrCode.amount,
        description: `Nạp tiền vào quỹ ${qrCode.transfer_content}`,
        reference_id: qrId,
        bank_transaction_id: bankTransactionId,
        balance_before: 0, // Sẽ được cập nhật khi admin confirm
        balance_after: 0,  // Sẽ được cập nhật khi admin confirm
        created_by: user.id,
        status: 'PENDING',
        metadata: {
          qr_id: qrId,
          bank_transaction_id: bankTransactionId,
          transfer_content: qrCode.transfer_content
        }
      })
      .select('id')
      .single();

    if (txError) {
      console.error('Error creating top-up transaction:', txError);
      return {
        success: false,
        error: txError.message
      };
    }

    // Đánh dấu QR code đã được sử dụng
    const { error: updateError } = await supabase
      .from('payment_qr_codes')
      .update({
        used_at: new Date().toISOString(),
        related_transaction_id: transactionId.id
      })
      .eq('id', qrId);

    if (updateError) {
      console.error('Error marking QR code as used:', updateError);
    }

    return {
      success: true,
      message: 'Đã ghi nhận yêu cầu nạp tiền. Số dư sẽ được cập nhật sau khi LTA xác nhận giao dịch.',
      data: { transactionId: transactionId.id }
    };
  } catch (error) {
    console.error('Unexpected error in confirmTopUpTransfer:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi xác nhận nạp tiền.'
    };
  }
}

/**
 * Admin xác nhận giao dịch nạp tiền
 * Chỉ admin hoặc carrier admin mới có thể thực hiện
 */
export async function adminConfirmTopUp(
  transactionId: string,
  actualAmount?: number
): Promise<FundResult> {
  try {
    const user = await getCurrentUser();
    
    // Kiểm tra quyền admin (cần implement permission check)
    if (!user?.profile || !['CARRIER_ADMIN'].includes(user.profile.role)) {
      return {
        success: false,
        message: 'Chỉ admin mới có thể xác nhận giao dịch nạp tiền.'
      };
    }

    const supabase = await createClient();

    // Lấy thông tin giao dịch
    const { data: transaction, error: txError } = await supabase
      .from('fund_transactions')
      .select(`
        *,
        fund:organization_prepaid_funds(*)
      `)
      .eq('id', transactionId)
      .eq('transaction_type', 'TOP_UP')
      .eq('status', 'PENDING')
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        message: 'Không tìm thấy giao dịch nạp tiền hợp lệ.'
      };
    }

    const finalAmount = actualAmount || transaction.amount;

    // Xử lý giao dịch nạp tiền với số tiền thực tế
    const { data: newTransactionId, error: processError } = await supabase
      .rpc('process_fund_transaction', {
        p_fund_id: transaction.fund_id,
        p_transaction_type: 'TOP_UP',
        p_amount: finalAmount,
        p_description: `Nạp tiền được xác nhận bởi admin - ${transaction.description}`,
        p_reference_id: transaction.reference_id,
        p_created_by: user.id
      });

    if (processError) {
      console.error('Error processing confirmed top-up:', processError);
      return {
        success: false,
        error: processError.message
      };
    }

    // Cập nhật trạng thái giao dịch gốc thành CONFIRMED
    const { error: updateError } = await supabase
      .from('fund_transactions')
      .update({
        status: 'CONFIRMED',
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
        balance_before: transaction.fund.balance - finalAmount,
        balance_after: transaction.fund.balance
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
    }

    // Revalidate relevant pages
    revalidatePath('/billing');
    revalidatePath('/admin/billing');

    return {
      success: true,
      message: `Đã xác nhận nạp tiền ${finalAmount.toLocaleString('vi-VN')} VNĐ thành công.`,
      data: { newTransactionId }
    };
  } catch (error) {
    console.error('Unexpected error in adminConfirmTopUp:', error);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi xác nhận nạp tiền.'
    };
  }
}