-- =====================================================
-- FIX REMAINING FUNCTIONS WITH MUTABLE SEARCH PATH - BATCH 1
-- Functions: process_fund_transaction, enable_rls_after_debug, disable_rls_for_debug
-- =====================================================

-- 1. Fix process_fund_transaction function
CREATE OR REPLACE FUNCTION public.process_fund_transaction(
    p_fund_id UUID,
    p_transaction_type public.fund_transaction_type,
    p_amount NUMERIC,
    p_description TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
    transaction_id UUID;
BEGIN
    -- Lấy số dư hiện tại với row-level lock
    SELECT balance INTO current_balance
    FROM public.organization_prepaid_funds
    WHERE id = p_fund_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fund not found: %', p_fund_id;
    END IF;
    
    -- Tính số dư mới
    CASE p_transaction_type
        WHEN 'TOP_UP', 'REFUND', 'ADJUSTMENT' THEN
            new_balance := current_balance + p_amount;
        WHEN 'PAYMENT' THEN
            new_balance := current_balance - p_amount;
            IF new_balance < 0 THEN
                RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', current_balance, p_amount;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
    END CASE;
    
    -- Tạo giao dịch
    INSERT INTO public.fund_transactions (
        fund_id,
        transaction_type,
        amount,
        description,
        reference_id,
        balance_before,
        balance_after,
        created_by,
        metadata,
        status
    ) VALUES (
        p_fund_id,
        p_transaction_type,
        p_amount,
        p_description,
        p_reference_id,
        current_balance,
        new_balance,
        p_created_by,
        p_metadata,
        'CONFIRMED'
    ) RETURNING id INTO transaction_id;
    
    -- Cập nhật số dư quỹ
    UPDATE public.organization_prepaid_funds
    SET 
        balance = new_balance,
        total_topped_up = CASE WHEN p_transaction_type = 'TOP_UP' THEN total_topped_up + p_amount ELSE total_topped_up END,
        total_spent = CASE WHEN p_transaction_type = 'PAYMENT' THEN total_spent + p_amount ELSE total_spent END,
        last_topup_at = CASE WHEN p_transaction_type = 'TOP_UP' THEN now() ELSE last_topup_at END,
        last_payment_at = CASE WHEN p_transaction_type = 'PAYMENT' THEN now() ELSE last_payment_at END
    WHERE id = p_fund_id;
    
    RETURN transaction_id;
END;
$$;

-- 2. Fix enable_rls_after_debug function
CREATE OR REPLACE FUNCTION public.enable_rls_after_debug()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    RETURN 'RLS re-enabled';
END;
$$;

-- 3. Fix disable_rls_for_debug function
CREATE OR REPLACE FUNCTION public.disable_rls_for_debug()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    RETURN 'RLS disabled for debugging - REMEMBER to re-enable!';
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.process_fund_transaction IS 'Xử lý giao dịch quỹ với transaction safety và search_path security';
COMMENT ON FUNCTION public.enable_rls_after_debug IS 'Re-enable RLS after debugging with search_path security';
COMMENT ON FUNCTION public.disable_rls_for_debug IS 'Disable RLS for debugging with search_path security';

-- Log completion
SELECT 'Fixed batch 1 functions: process_fund_transaction, enable_rls_after_debug, disable_rls_for_debug' as status;