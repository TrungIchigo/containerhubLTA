-- Comprehensive fix for all remaining functions with mutable search_path warnings
-- This script fixes functions that have SECURITY DEFINER but missing SET search_path = ''
-- or functions that are missing both SECURITY DEFINER and SET search_path = ''

-- Fix handle_new_user function (from DB Setup.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, organization_id, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'organization_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Fix get_current_org_id function (from DB Setup.sql)
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Fix expire_old_cod_requests function (from cod_module_foundation.sql)
CREATE OR REPLACE FUNCTION public.expire_old_cod_requests()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    expired_request RECORD;
BEGIN
    -- Tìm và xử lý các yêu cầu hết hạn
    FOR expired_request IN
        SELECT id, dropoff_order_id FROM public.cod_requests
        WHERE status = 'PENDING' AND expires_at < NOW()
    LOOP
        -- Cập nhật trạng thái yêu cầu COD thành EXPIRED
        UPDATE public.cod_requests 
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE id = expired_request.id;
        
        -- Rollback trạng thái container về AVAILABLE
        UPDATE public.import_containers 
        SET status = 'AVAILABLE'
        WHERE id = expired_request.dropoff_order_id;
        
        -- Ghi audit log
        INSERT INTO public.cod_audit_logs (request_id, actor_org_name, action, details)
        VALUES (
            expired_request.id, 
            'SYSTEM', 
            'EXPIRED', 
            'Request expired automatically'
        );
    END LOOP;
END;
$$;

-- Fix generate_vietqr_code function (from 16_create_prepaid_fund_schema.sql)
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
SET search_path = ''
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
    FROM public.organization_prepaid_funds opf
    JOIN public.organizations o ON opf.organization_id = o.id
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
    
    -- Tạo QR string (simplified version)
    qr_string := format('VietQR|%s|%s|%s', p_amount, content, fund_info.fund_code);
    
    -- Thời gian hết hạn (15 phút)
    expiry_time := NOW() + INTERVAL '15 minutes';
    
    -- Tạo record ID
    qr_record_id := gen_random_uuid();
    
    -- Insert vào bảng qr_codes nếu có
    -- INSERT INTO public.qr_codes (id, organization_id, amount, purpose, qr_data, transfer_content, expires_at)
    -- VALUES (qr_record_id, p_organization_id, p_amount, p_purpose, qr_string, content, expiry_time);
    
    -- Return kết quả
    RETURN QUERY SELECT 
        qr_record_id,
        qr_string,
        content,
        expiry_time;
END;
$$;

-- Fix fuzzy_search_organizations function (if exists)
CREATE OR REPLACE FUNCTION public.fuzzy_search_organizations(
    search_term TEXT, 
    org_type public.organization_type
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    organization_type public.organization_type,
    similarity_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.organization_type,
        similarity(o.name, search_term) as similarity_score
    FROM public.organizations o
    WHERE o.organization_type = org_type
      AND similarity(o.name, search_term) > 0.3
    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$;

SELECT 'All remaining functions fixed successfully' AS result;