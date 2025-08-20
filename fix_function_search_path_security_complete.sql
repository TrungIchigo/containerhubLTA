-- Complete SQL script to fix function search path security issues
-- This script adds SECURITY DEFINER and SET search_path = '' to all functions
-- to address mutable search_path warnings and security concerns

-- 1. Fix set_updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

-- 2. Fix get_current_org_id function
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- 3. Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN user_role_val;
END;
$function$;

-- 4. Fix handle_auto_approval trigger function
CREATE OR REPLACE FUNCTION public.handle_auto_approval()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    matching_score INTEGER;
    auto_approval_threshold INTEGER := 80;
BEGIN
    -- Calculate matching score
    SELECT public.calculate_matching_score(
        NEW.pickup_location,
        NEW.delivery_location,
        NEW.container_type,
        NEW.container_size
    ) INTO matching_score;
    
    -- Auto approve if score is above threshold
    IF matching_score >= auto_approval_threshold THEN
        NEW.status := 'APPROVED';
        NEW.approved_at := NOW();
        NEW.approved_by := 'SYSTEM';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 5. Fix calculate_matching_score functions (both overloads)
CREATE OR REPLACE FUNCTION public.calculate_matching_score(
    pickup_location text,
    delivery_location text,
    container_type1 text,
    container_size1 text
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Location matching logic
    IF pickup_location IS NOT NULL AND delivery_location IS NOT NULL THEN
        score := score + 40;
    END IF;
    
    -- Container type matching
    IF container_type1 IS NOT NULL THEN
        score := score + 30;
    END IF;
    
    -- Container size matching
    IF container_size1 IS NOT NULL THEN
        score := score + 30;
    END IF;
    
    RETURN score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_matching_score(
    pickup_location text,
    delivery_location text,
    container_type1 uuid,
    container_size1 uuid
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Location matching logic
    IF pickup_location IS NOT NULL AND delivery_location IS NOT NULL THEN
        score := score + 40;
    END IF;
    
    -- Container type matching
    IF container_type1 IS NOT NULL THEN
        score := score + 30;
    END IF;
    
    -- Container size matching
    IF container_size1 IS NOT NULL THEN
        score := score + 30;
    END IF;
    
    RETURN score;
END;
$function$;

-- 6. Fix approve_cod_request function
CREATE OR REPLACE FUNCTION public.approve_cod_request(
    request_id uuid,
    approver_id uuid,
    container_id uuid DEFAULT NULL::uuid,
    notes text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    result json;
    request_record record;
BEGIN
    -- Disable RLS temporarily for this function
    SET row_security = off;
    
    -- Get the request details
    SELECT * INTO request_record
    FROM public.cod_requests
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'COD request not found';
    END IF;
    
    -- Update request status
    UPDATE public.cod_requests
    SET 
        status = 'APPROVED',
        approved_by = approver_id,
        approved_at = NOW(),
        container_id = COALESCE(approve_cod_request.container_id, cod_requests.container_id),
        notes = COALESCE(approve_cod_request.notes, cod_requests.notes)
    WHERE id = request_id;
    
    -- Update container status if provided
    IF container_id IS NOT NULL THEN
        UPDATE public.containers
        SET status = 'ASSIGNED'
        WHERE id = container_id;
    END IF;
    
    -- Log audit trail
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (
        'cod_requests',
        request_id,
        'APPROVED',
        row_to_json(request_record),
        json_build_object('status', 'APPROVED', 'approved_by', approver_id, 'approved_at', NOW()),
        approver_id
    );
    
    -- Re-enable RLS
    SET row_security = on;
    
    result := json_build_object(
        'success', true,
        'message', 'COD request approved successfully',
        'request_id', request_id
    );
    
    RETURN result;
END;
$function$;

-- 7. Fix reject_cod_request function
CREATE OR REPLACE FUNCTION public.reject_cod_request(
    request_id uuid,
    rejector_id uuid,
    rejection_reason text
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    result json;
    request_record record;
BEGIN
    -- Disable RLS temporarily for this function
    SET row_security = off;
    
    -- Get the request details
    SELECT * INTO request_record
    FROM public.cod_requests
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'COD request not found';
    END IF;
    
    -- Update request status
    UPDATE public.cod_requests
    SET 
        status = 'REJECTED',
        rejected_by = rejector_id,
        rejected_at = NOW(),
        rejection_reason = reject_cod_request.rejection_reason
    WHERE id = request_id;
    
    -- Log audit trail
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (
        'cod_requests',
        request_id,
        'REJECTED',
        row_to_json(request_record),
        json_build_object('status', 'REJECTED', 'rejected_by', rejector_id, 'rejected_at', NOW(), 'rejection_reason', rejection_reason),
        rejector_id
    );
    
    -- Re-enable RLS
    SET row_security = on;
    
    result := json_build_object(
        'success', true,
        'message', 'COD request rejected successfully',
        'request_id', request_id
    );
    
    RETURN result;
END;
$function$;

-- 8. Fix process_fund_transaction function
CREATE OR REPLACE FUNCTION public.process_fund_transaction(
    p_organization_id uuid,
    p_amount numeric,
    p_transaction_type transaction_type,
    p_description text DEFAULT NULL::text,
    p_reference_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    current_balance numeric;
    new_balance numeric;
    transaction_id uuid;
    result json;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM public.organization_wallets
    WHERE organization_id = p_organization_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization wallet not found';
    END IF;
    
    -- Calculate new balance
    IF p_transaction_type = 'CREDIT' THEN
        new_balance := current_balance + p_amount;
    ELSE
        new_balance := current_balance - p_amount;
        IF new_balance < 0 THEN
            RAISE EXCEPTION 'Insufficient funds';
        END IF;
    END IF;
    
    -- Update wallet balance
    UPDATE public.organization_wallets
    SET balance = new_balance, updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Create transaction record
    INSERT INTO public.fund_transactions (
        organization_id, amount, transaction_type, description, reference_id, balance_after
    ) VALUES (
        p_organization_id, p_amount, p_transaction_type, p_description, p_reference_id, new_balance
    ) RETURNING id INTO transaction_id;
    
    result := json_build_object(
        'success', true,
        'transaction_id', transaction_id,
        'new_balance', new_balance
    );
    
    RETURN result;
END;
$function$;

-- 9. Fix mark_invoice_as_paid function
CREATE OR REPLACE FUNCTION public.mark_invoice_as_paid(
    p_invoice_id uuid,
    p_payment_method text DEFAULT 'BANK_TRANSFER'::text,
    p_payment_reference text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    invoice_record record;
    result json;
BEGIN
    -- Get invoice details
    SELECT * INTO invoice_record
    FROM public.invoices
    WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;
    
    IF invoice_record.status = 'PAID' THEN
        RAISE EXCEPTION 'Invoice is already paid';
    END IF;
    
    -- Update invoice status
    UPDATE public.invoices
    SET 
        status = 'PAID',
        paid_at = NOW(),
        payment_method = p_payment_method,
        payment_reference = p_payment_reference
    WHERE id = p_invoice_id;
    
    result := json_build_object(
        'success', true,
        'message', 'Invoice marked as paid successfully',
        'invoice_id', p_invoice_id
    );
    
    RETURN result;
END;
$function$;

-- 10. Fix check_cod_container_status function
CREATE OR REPLACE FUNCTION public.check_cod_container_status(
    p_container_number text
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    container_record record;
    cod_record record;
    result json;
BEGIN
    -- Get container details
    SELECT * INTO container_record
    FROM public.containers
    WHERE container_number = p_container_number;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'found', false,
            'message', 'Container not found'
        );
        RETURN result;
    END IF;
    
    -- Get COD request details if exists
    SELECT * INTO cod_record
    FROM public.cod_requests
    WHERE container_id = container_record.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    result := json_build_object(
        'found', true,
        'container', row_to_json(container_record),
        'cod_request', CASE WHEN cod_record IS NOT NULL THEN row_to_json(cod_record) ELSE NULL END
    );
    
    RETURN result;
END;
$function$;

-- 11. Fix get_dashboard_stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    org_id uuid,
    start_date date DEFAULT NULL::date,
    end_date date DEFAULT NULL::date
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    result json;
    total_requests integer;
    pending_requests integer;
    approved_requests integer;
    rejected_requests integer;
    total_containers integer;
    available_containers integer;
BEGIN
    -- Set default date range if not provided
    IF start_date IS NULL THEN
        start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    -- Get COD request statistics
    SELECT COUNT(*) INTO total_requests
    FROM public.cod_requests cr
    WHERE cr.organization_id = org_id
    AND cr.created_at::date BETWEEN start_date AND end_date;
    
    SELECT COUNT(*) INTO pending_requests
    FROM public.cod_requests cr
    WHERE cr.organization_id = org_id
    AND cr.status = 'PENDING'
    AND cr.created_at::date BETWEEN start_date AND end_date;
    
    SELECT COUNT(*) INTO approved_requests
    FROM public.cod_requests cr
    WHERE cr.organization_id = org_id
    AND cr.status = 'APPROVED'
    AND cr.created_at::date BETWEEN start_date AND end_date;
    
    SELECT COUNT(*) INTO rejected_requests
    FROM public.cod_requests cr
    WHERE cr.organization_id = org_id
    AND cr.status = 'REJECTED'
    AND cr.created_at::date BETWEEN start_date AND end_date;
    
    -- Get container statistics
    SELECT COUNT(*) INTO total_containers
    FROM public.containers c
    WHERE c.organization_id = org_id;
    
    SELECT COUNT(*) INTO available_containers
    FROM public.containers c
    WHERE c.organization_id = org_id
    AND c.status = 'AVAILABLE';
    
    result := json_build_object(
        'total_requests', total_requests,
        'pending_requests', pending_requests,
        'approved_requests', approved_requests,
        'rejected_requests', rejected_requests,
        'total_containers', total_containers,
        'available_containers', available_containers,
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        )
    );
    
    RETURN result;
END;
$function$;

-- 12. Fix get_dashboard_trend_data function
CREATE OR REPLACE FUNCTION public.get_dashboard_trend_data(
    org_id uuid,
    start_date date DEFAULT NULL::date,
    end_date date DEFAULT NULL::date
)
RETURNS json
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    result json;
    daily_stats json;
BEGIN
    -- Set default date range if not provided
    IF start_date IS NULL THEN
        start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    -- Get daily statistics
    SELECT json_agg(
        json_build_object(
            'date', date_series,
            'requests', COALESCE(daily_counts.request_count, 0),
            'approved', COALESCE(daily_counts.approved_count, 0)
        ) ORDER BY date_series
    ) INTO daily_stats
    FROM (
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date_series
    ) dates
    LEFT JOIN (
        SELECT 
            cr.created_at::date as request_date,
            COUNT(*) as request_count,
            COUNT(CASE WHEN cr.status = 'APPROVED' THEN 1 END) as approved_count
        FROM public.cod_requests cr
        WHERE cr.organization_id = org_id
        AND cr.created_at::date BETWEEN start_date AND end_date
        GROUP BY cr.created_at::date
    ) daily_counts ON dates.date_series = daily_counts.request_date;
    
    result := json_build_object(
        'daily_stats', daily_stats,
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        )
    );
    
    RETURN result;
END;
$function$;

-- 13. Fix get_carrier_kpis function
CREATE OR REPLACE FUNCTION public.get_carrier_kpis(carrier_org_id uuid)
RETURNS TABLE(pending_count bigint, approved_this_month bigint, total_approved bigint)
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        -- Pending requests count
        (SELECT COUNT(*) 
         FROM public.cod_requests cr 
         WHERE cr.carrier_organization_id = carrier_org_id 
         AND cr.status = 'PENDING') as pending_count,
        
        -- Approved requests this month
        (SELECT COUNT(*) 
         FROM public.cod_requests cr 
         WHERE cr.carrier_organization_id = carrier_org_id 
         AND cr.status = 'APPROVED' 
         AND DATE_TRUNC('month', cr.approved_at) = DATE_TRUNC('month', CURRENT_DATE)) as approved_this_month,
        
        -- Total approved requests
        (SELECT COUNT(*) 
         FROM public.cod_requests cr 
         WHERE cr.carrier_organization_id = carrier_org_id 
         AND cr.status = 'APPROVED') as total_approved;
END;
$function$;

-- 14. Fix calculate_distance_km function
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
    lat1 numeric,
    lon1 numeric,
    lat2 numeric,
    lon2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    distance_km numeric;
BEGIN
    -- Return NULL if any coordinate is NULL
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate distance using PostGIS
    SELECT ST_Distance(
        ST_GeogFromText('POINT(' || lon1 || ' ' || lat1 || ')'),
        ST_GeogFromText('POINT(' || lon2 || ' ' || lat2 || ')')
    ) / 1000 INTO distance_km;
    
    RETURN distance_km;
END;
$function$;

-- 15. Fix generate_vietqr_code function
CREATE OR REPLACE FUNCTION public.generate_vietqr_code(
    p_organization_id uuid,
    p_amount numeric,
    p_purpose character varying,
    p_cod_request_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(qr_id uuid, qr_data text, transfer_content text, expires_at timestamp with time zone)
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    new_qr_id uuid;
    bank_account_number text := '1234567890';
    bank_code text := 'VCB';
    account_name text := 'CONG TY TNHH CONTAINER HUB';
    generated_qr_data text;
    generated_transfer_content text;
    expiry_time timestamp with time zone;
BEGIN
    -- Generate unique QR ID
    new_qr_id := gen_random_uuid();
    
    -- Generate transfer content
    IF p_cod_request_id IS NOT NULL THEN
        generated_transfer_content := 'COD ' || p_cod_request_id::text;
    ELSE
        generated_transfer_content := 'TOPUP ' || p_organization_id::text;
    END IF;
    
    -- Generate VietQR data (simplified format)
    generated_qr_data := format(
        'VietQR|%s|%s|%s|%s|%s',
        bank_code,
        bank_account_number,
        account_name,
        p_amount::text,
        generated_transfer_content
    );
    
    -- Set expiry time (24 hours from now)
    expiry_time := NOW() + INTERVAL '24 hours';
    
    -- Store QR code in database
    INSERT INTO public.payment_qr_codes (
        id,
        organization_id,
        amount,
        purpose,
        cod_request_id,
        qr_data,
        transfer_content,
        expires_at
    ) VALUES (
        new_qr_id,
        p_organization_id,
        p_amount,
        p_purpose,
        p_cod_request_id,
        generated_qr_data,
        generated_transfer_content,
        expiry_time
    );
    
    -- Return the generated QR code details
    RETURN QUERY
    SELECT 
        new_qr_id,
        generated_qr_data,
        generated_transfer_content,
        expiry_time;
END;
$function$;

-- 16. Fix is_carrier_admin function
CREATE OR REPLACE FUNCTION public.is_carrier_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'CARRIER_ADMIN'
  );
$function$;

-- 17. Fix fuzzy_search_organizations function
CREATE OR REPLACE FUNCTION public.fuzzy_search_organizations(search_term text, org_type organization_type)
RETURNS TABLE(id uuid, name text, type organization_type, tax_code text, address text, phone_number text, status organization_status, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.type,
        o.tax_code,
        o.address,
        o.phone_number,
        o.status,
        o.created_at
    FROM public.organizations o
    WHERE
        -- Fuzzy matching with ILIKE
        lower(o.name) LIKE '%' || lower(search_term) || '%'
        AND o.type = org_type
        AND o.status = 'ACTIVE'
    ORDER BY 
        -- Prioritize exact matches
        CASE 
            WHEN lower(o.name) = lower(search_term) THEN 1 
            WHEN lower(o.name) LIKE lower(search_term) || '%' THEN 2
            ELSE 3 
        END,
        -- Then by length (shorter names first for better matches)
        length(o.name),
        o.created_at DESC
    LIMIT 5;
END;
$function$;

-- Script execution completed
-- All functions have been updated with SECURITY DEFINER and SET search_path = ''
-- This addresses mutable search_path security warnings