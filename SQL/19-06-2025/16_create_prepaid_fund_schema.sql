-- =====================================================
-- PREPAID FUND SYSTEM SCHEMA  
-- Purpose: Hỗ trợ thanh toán COD bằng quỹ i-Prepaid@LTA
-- Date: 19-06-2025
-- =====================================================

-- 1. TẠO ENUM CHO LOẠI GIAO DỊCH QUỸ
CREATE TYPE public.fund_transaction_type AS ENUM (
    'TOP_UP',           -- Nạp tiền vào quỹ
    'PAYMENT',          -- Thanh toán phí COD
    'REFUND',           -- Hoàn trả tiền  
    'ADJUSTMENT'        -- Điều chỉnh số dư
);

CREATE TYPE public.fund_transaction_status AS ENUM (
    'PENDING',          -- Chờ xác nhận (chuyển khoản chưa được verify)
    'CONFIRMED',        -- Đã xác nhận
    'CANCELLED',        -- Đã hủy
    'FAILED'            -- Thất bại
);

-- 2. BẢNG QUỸ PREPAID CỦA TỪ ORGANIZATIONS
CREATE TABLE public.organization_prepaid_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    balance NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Thông tin quỹ
    fund_code VARCHAR(20) UNIQUE NOT NULL, -- Mã quỹ duy nhất (ví dụ: LP0000222)
    fund_name TEXT NOT NULL,               -- Tên quỹ hiển thị
    
    -- Giới hạn giao dịch
    daily_topup_limit NUMERIC(15,2) DEFAULT 100000000,   -- 100M VNĐ
    monthly_topup_limit NUMERIC(15,2) DEFAULT 1000000000, -- 1B VNĐ
    
    -- Tracking
    total_topped_up NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_spent NUMERIC(15,2) NOT NULL DEFAULT 0,
    last_topup_at TIMESTAMPTZ,
    last_payment_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BẢNG LỊCH SỬ GIAO DỊCH QUỸ
CREATE TABLE public.fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES public.organization_prepaid_funds(id) ON DELETE CASCADE,
    
    -- Thông tin giao dịch
    transaction_type public.fund_transaction_type NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Trạng thái và mô tả
    status public.fund_transaction_status NOT NULL DEFAULT 'PENDING',
    description TEXT,
    reference_id TEXT, -- ID tham chiếu (ví dụ: COD request ID, bank transaction ID)
    
    -- Thông tin ngân hàng (cho top-up)
    bank_transaction_id TEXT,
    bank_reference TEXT,
    payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
    
    -- Số dư trước và sau giao dịch 
    balance_before NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2) NOT NULL,
    
    -- Người thực hiện
    created_by UUID REFERENCES auth.users(id),
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB, -- Lưu thông tin bổ sung (QR code info, etc.)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BẢNG VietQR CODES (CHO TOP-UP VÀ PAYMENT)
CREATE TABLE public.payment_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thông tin QR
    qr_code_data TEXT NOT NULL, -- Raw QR data string
    qr_purpose VARCHAR(20) NOT NULL CHECK (qr_purpose IN ('TOP_UP', 'COD_PAYMENT')),
    
    -- Thông tin thanh toán
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Thông tin VietQR
    bank_code VARCHAR(10) NOT NULL DEFAULT 'LPB', -- Liên Việt Post Bank
    account_number VARCHAR(50) NOT NULL,
    account_name TEXT NOT NULL DEFAULT 'CONG TY CO PHAN LOGISTICS TECHNOLOGY APPLICATION',
    transfer_content TEXT NOT NULL, -- Nội dung chuyển khoản
    
    -- Liên kết
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    related_fund_id UUID REFERENCES public.organization_prepaid_funds(id),
    related_cod_request_id UUID REFERENCES public.cod_requests(id),
    related_transaction_id UUID REFERENCES public.fund_transactions(id),
    
    -- Trạng thái
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
    used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TẠO INDEXES ĐỂ TỐI ƯU PERFORMANCE
CREATE INDEX idx_org_prepaid_funds_org_id ON public.organization_prepaid_funds(organization_id);
CREATE INDEX idx_org_prepaid_funds_fund_code ON public.organization_prepaid_funds(fund_code);

CREATE INDEX idx_fund_transactions_fund_id ON public.fund_transactions(fund_id);
CREATE INDEX idx_fund_transactions_type_status ON public.fund_transactions(transaction_type, status);
CREATE INDEX idx_fund_transactions_created_at ON public.fund_transactions(created_at);
CREATE INDEX idx_fund_transactions_reference_id ON public.fund_transactions(reference_id);

CREATE INDEX idx_payment_qr_codes_org_id ON public.payment_qr_codes(organization_id);
CREATE INDEX idx_payment_qr_codes_purpose_active ON public.payment_qr_codes(qr_purpose, is_active);
CREATE INDEX idx_payment_qr_codes_expires_at ON public.payment_qr_codes(expires_at);

-- 6. THIẾT LẬP ROW LEVEL SECURITY
ALTER TABLE public.organization_prepaid_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho organization_prepaid_funds
CREATE POLICY "Organizations can view their own fund" ON public.organization_prepaid_funds
FOR SELECT USING (organization_id = public.get_current_org_id());

CREATE POLICY "Organizations can update their own fund balance via functions" ON public.organization_prepaid_funds
FOR UPDATE USING (organization_id = public.get_current_org_id());

-- RLS Policies cho fund_transactions  
CREATE POLICY "Organizations can view their own fund transactions" ON public.fund_transactions
FOR SELECT USING (
    fund_id IN (
        SELECT id FROM public.organization_prepaid_funds 
        WHERE organization_id = public.get_current_org_id()
    )
);

CREATE POLICY "System can insert fund transactions" ON public.fund_transactions
FOR INSERT WITH CHECK (true);

-- RLS Policies cho payment_qr_codes
CREATE POLICY "Organizations can view their own QR codes" ON public.payment_qr_codes
FOR SELECT USING (organization_id = public.get_current_org_id());

CREATE POLICY "Organizations can create their own QR codes" ON public.payment_qr_codes
FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

-- 7. TẠO TRIGGERS TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE TRIGGER update_org_prepaid_funds_updated_at
    BEFORE UPDATE ON public.organization_prepaid_funds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at
    BEFORE UPDATE ON public.fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. FUNCTION TẠO QUỸ PREPAID TỰ ĐỘNG KHI TẠO ORGANIZATION MỚI
CREATE OR REPLACE FUNCTION public.create_prepaid_fund_for_organization()
RETURNS TRIGGER AS $$
DECLARE
    fund_code_seq INTEGER;
    generated_fund_code TEXT;
BEGIN
    -- Tạo mã quỹ tự động: LP + 7 chữ số
    SELECT COALESCE(MAX(CAST(SUBSTRING(fund_code FROM 3) AS INTEGER)), 0) + 1
    INTO fund_code_seq
    FROM organization_prepaid_funds
    WHERE fund_code LIKE 'LP%';
    
    generated_fund_code := 'LP' || LPAD(fund_code_seq::TEXT, 7, '0');
    
    -- Tạo quỹ prepaid cho organization mới
    INSERT INTO public.organization_prepaid_funds (
        organization_id,
        fund_code,
        fund_name,
        balance
    ) VALUES (
        NEW.id,
        generated_fund_code,
        NEW.name || ' - Quỹ i-Prepaid@LTA',
        0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo trigger để tự động tạo quỹ khi có organization mới
CREATE TRIGGER auto_create_prepaid_fund
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.create_prepaid_fund_for_organization();

-- 9. FUNCTION XỬ LÝ GIAO DỊCH QUỸ (TOP-UP VÀ PAYMENT)
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
AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
    transaction_id UUID;
BEGIN
    -- Lấy số dư hiện tại với row-level lock
    SELECT balance INTO current_balance
    FROM organization_prepaid_funds
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
    INSERT INTO fund_transactions (
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
    UPDATE organization_prepaid_funds
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

-- 10. FUNCTION TẠO VietQR CODE
CREATE OR REPLACE FUNCTION public.generate_vietqr_code(
    p_organization_id UUID,
    p_amount NUMERIC,
    p_purpose VARCHAR(20),
    p_cod_request_id UUID DEFAULT NULL
)
RETURNS TABLE (
    qr_id UUID,
    qr_data TEXT,
    transfer_content TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fund_info RECORD;
    content TEXT;
    qr_string TEXT;
    qr_record_id UUID;
    expiry_time TIMESTAMPTZ;
BEGIN
    -- Lấy thông tin quỹ
    SELECT opf.*, o.name as org_name
    INTO fund_info
    FROM organization_prepaid_funds opf
    JOIN organizations o ON opf.organization_id = o.id
    WHERE opf.organization_id = p_organization_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prepaid fund not found for organization: %', p_organization_id;
    END IF;
    
    -- Tạo nội dung chuyển khoản
    CASE p_purpose
        WHEN 'TOP_UP' THEN
            content := 'NAP QUY ' || fund_info.fund_code;
        WHEN 'COD_PAYMENT' THEN
            content := 'PAY COD ' || COALESCE(p_cod_request_id::TEXT, 'UNKNOWN');
        ELSE
            RAISE EXCEPTION 'Invalid QR purpose: %', p_purpose;
    END CASE;
    
    -- Tạo QR data string (simplified - trong thực tế cần format theo chuẩn VietQR)
    qr_string := format('BANK=LPB|ACC=1234567890|AMOUNT=%s|CONTENT=%s', p_amount, content);
    
    -- Thời gian hết hạn: 30 phút
    expiry_time := now() + INTERVAL '30 minutes';
    
    -- Lưu QR code vào database
    INSERT INTO payment_qr_codes (
        organization_id,
        related_fund_id,
        related_cod_request_id,
        qr_code_data,
        qr_purpose,
        amount,
        account_number,
        account_name,
        transfer_content,
        expires_at
    ) VALUES (
        p_organization_id,
        fund_info.id,
        p_cod_request_id,
        qr_string,
        p_purpose,
        p_amount,
        '1234567890', -- Thay bằng số tài khoản thực
        'CONG TY CO PHAN LOGISTICS TECHNOLOGY APPLICATION',
        content,
        expiry_time
    ) RETURNING id INTO qr_record_id;
    
    -- Trả về thông tin QR
    RETURN QUERY SELECT 
        qr_record_id,
        qr_string,
        content,
        expiry_time;
END;
$$;

-- 11. CHÈN DỮ LIỆU MẪU CHO CÁC ORGANIZATION HIỆN TẠI
INSERT INTO public.organization_prepaid_funds (organization_id, fund_code, fund_name, balance)
SELECT 
    o.id,
    'LP' || LPAD((ROW_NUMBER() OVER (ORDER BY o.created_at))::TEXT, 7, '0'),
    o.name || ' - Quỹ i-Prepaid@LTA',
    0
FROM public.organizations o
LEFT JOIN public.organization_prepaid_funds opf ON o.id = opf.organization_id
WHERE opf.id IS NULL;

-- 12. COMMENTS
COMMENT ON TABLE public.organization_prepaid_funds IS 'Quỹ prepaid của từng organization để thanh toán COD';
COMMENT ON TABLE public.fund_transactions IS 'Lịch sử giao dịch quỹ (nạp tiền, thanh toán, hoàn trả)';
COMMENT ON TABLE public.payment_qr_codes IS 'QR codes cho thanh toán VietQR (nạp tiền và thanh toán COD)';

COMMENT ON FUNCTION public.process_fund_transaction IS 'Xử lý giao dịch quỹ với transaction safety';
COMMENT ON FUNCTION public.generate_vietqr_code IS 'Tạo VietQR code cho thanh toán và nạp tiền';

-- Log hoàn thành
DO $$
BEGIN
    RAISE NOTICE '=== PREPAID FUND SYSTEM SETUP COMPLETED ===';
    RAISE NOTICE 'Created tables: organization_prepaid_funds, fund_transactions, payment_qr_codes';
    RAISE NOTICE 'Created functions: process_fund_transaction(), generate_vietqr_code()';
    RAISE NOTICE 'Auto-created prepaid funds for existing organizations';
END $$; 