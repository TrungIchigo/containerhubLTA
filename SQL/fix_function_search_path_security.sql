-- Fix Function Search Path Security Issues
-- This script adds SECURITY DEFINER and SET search_path = '' to all functions with mutable search_path warnings
-- Based on Supabase Performance Security Lints warnings

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Fix set_updated_at function
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

-- Fix get_current_org_id function
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

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- =============================================================================
-- AUTO APPROVAL FUNCTIONS
-- =============================================================================

-- Fix handle_auto_approval function
CREATE OR REPLACE FUNCTION public.handle_auto_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    matching_rule RECORD;
    condition_met BOOLEAN := TRUE;
    rule_condition RECORD;
BEGIN
    -- Only process PENDING requests
    IF NEW.status != 'PENDING' THEN
        RETURN NEW;
    END IF;
    
    -- Find matching auto approval rules for the organization
    FOR matching_rule IN
        SELECT * FROM public.auto_approval_rules
        WHERE organization_id = NEW.requesting_org_id
        AND is_active = true
        ORDER BY priority ASC
    LOOP
        condition_met := TRUE;
        
        -- Check all conditions for this rule
        FOR rule_condition IN
            SELECT * FROM public.rule_conditions
            WHERE rule_id = matching_rule.id
        LOOP
            -- Check container type condition
            IF rule_condition.type = 'CONTAINER_TYPE' THEN
                IF rule_condition.operator = 'EQUALS' THEN
                    SELECT container_type INTO container_type_value
                    FROM public.import_containers
                    WHERE id = NEW.dropoff_order_id;
                    
                    IF container_type_value != rule_condition.value THEN
                        condition_met := FALSE;
                        EXIT;
                    END IF;
                END IF;
            END IF;
            
            -- Add more condition checks as needed
        END LOOP;
        
        -- If all conditions met, auto-approve
        IF condition_met THEN
            NEW.status := 'APPROVED';
            NEW.approved_at := NOW();
            NEW.approved_by_org_id := NEW.approving_org_id;
            EXIT; -- Stop checking other rules
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Fix calculate_matching_score function
CREATE OR REPLACE FUNCTION public.calculate_matching_score(
    dropoff_lat NUMERIC,
    dropoff_lon NUMERIC,
    pickup_lat NUMERIC,
    pickup_lon NUMERIC,
    dropoff_time TIMESTAMPTZ,
    pickup_time TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    distance_km NUMERIC;
    time_diff_hours NUMERIC;
    distance_score NUMERIC;
    time_score NUMERIC;
    final_score NUMERIC;
BEGIN
    -- Calculate distance using Haversine formula
    distance_km := public.calculate_distance_km(dropoff_lat, dropoff_lon, pickup_lat, pickup_lon);
    
    -- Calculate time difference in hours
    time_diff_hours := EXTRACT(EPOCH FROM (pickup_time - dropoff_time)) / 3600;
    
    -- Distance scoring (closer is better, max 50 points)
    IF distance_km <= 5 THEN
        distance_score := 50;
    ELSIF distance_km <= 10 THEN
        distance_score := 40;
    ELSIF distance_km <= 20 THEN
        distance_score := 30;
    ELSIF distance_km <= 50 THEN
        distance_score := 20;
    ELSE
        distance_score := 10;
    END IF;
    
    -- Time scoring (optimal window is 2-24 hours, max 50 points)
    IF time_diff_hours >= 2 AND time_diff_hours <= 24 THEN
        time_score := 50;
    ELSIF time_diff_hours >= 1 AND time_diff_hours < 2 THEN
        time_score := 30;
    ELSIF time_diff_hours > 24 AND time_diff_hours <= 48 THEN
        time_score := 30;
    ELSE
        time_score := 10;
    END IF;
    
    final_score := distance_score + time_score;
    
    RETURN final_score;
END;
$$;

-- =============================================================================
-- COD SYSTEM FUNCTIONS
-- =============================================================================

-- Fix approve_cod_request function
CREATE OR REPLACE FUNCTION public.approve_cod_request(
    request_id UUID,
    approver_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get request details
    SELECT * INTO request_record
    FROM public.cod_requests
    WHERE id = request_id AND status = 'PENDING';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status
    UPDATE public.cod_requests
    SET 
        status = 'APPROVED',
        approved_at = NOW(),
        approved_by_org_id = approver_org_id,
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Update container status
    UPDATE public.import_containers
    SET status = 'COD_APPROVED'
    WHERE id = request_record.dropoff_order_id;
    
    RETURN TRUE;
END;
$$;

-- Fix reject_cod_request function
CREATE OR REPLACE FUNCTION public.reject_cod_request(
    request_id UUID,
    approver_org_id UUID,
    rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get request details
    SELECT * INTO request_record
    FROM public.cod_requests
    WHERE id = request_id AND status = 'PENDING';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status
    UPDATE public.cod_requests
    SET 
        status = 'REJECTED',
        rejected_at = NOW(),
        approved_by_org_id = approver_org_id,
        rejection_reason = rejection_reason,
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Rollback container status
    UPDATE public.import_containers
    SET status = 'AVAILABLE'
    WHERE id = request_record.dropoff_order_id;
    
    RETURN TRUE;
END;
$$;

-- Fix check_cod_container_status function
CREATE OR REPLACE FUNCTION public.check_cod_container_status(
    container_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    container_status TEXT;
BEGIN
    SELECT status INTO container_status
    FROM public.import_containers
    WHERE id = container_id;
    
    RETURN COALESCE(container_status, 'NOT_FOUND');
END;
$$;

-- Fix fix_approved_cod_request function
CREATE OR REPLACE FUNCTION public.fix_approved_cod_request(
    request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Update the COD request to mark it as completed
    UPDATE public.cod_requests
    SET 
        status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = request_id AND status = 'APPROVED';
    
    RETURN FOUND;
END;
$$;

-- =============================================================================
-- FINANCIAL SYSTEM FUNCTIONS
-- =============================================================================

-- Fix process_fund_transaction function
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
    v_transaction_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;
    
    -- Get current balance
    SELECT balance INTO v_current_balance
    FROM public.organization_prepaid_funds
    WHERE id = p_fund_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fund not found';
    END IF;
    
    -- Calculate new balance
    IF p_transaction_type = 'TOP_UP' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSIF p_transaction_type = 'PAYMENT' THEN
        IF v_current_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
        v_new_balance := v_current_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type';
    END IF;
    
    -- Create transaction record
    INSERT INTO public.fund_transactions (
        fund_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        reference_id,
        created_by,
        metadata
    ) VALUES (
        p_fund_id,
        p_transaction_type,
        p_amount,
        v_current_balance,
        v_new_balance,
        p_description,
        p_reference_id,
        p_created_by,
        p_metadata
    ) RETURNING id INTO v_transaction_id;
    
    -- Update fund balance
    UPDATE public.organization_prepaid_funds
    SET 
        balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_fund_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Fix mark_invoice_as_paid function
CREATE OR REPLACE FUNCTION public.mark_invoice_as_paid(
    invoice_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.invoices
    SET 
        status = 'PAID',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = invoice_id AND status = 'PENDING';
    
    RETURN FOUND;
END;
$$;

-- Fix create_invoice_for_organization function
CREATE OR REPLACE FUNCTION public.create_invoice_for_organization(
    org_id UUID,
    amount NUMERIC,
    description TEXT,
    due_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    invoice_id UUID;
    invoice_number TEXT;
BEGIN
    -- Generate invoice number
    SELECT public.generate_invoice_number() INTO invoice_number;
    
    -- Create invoice
    INSERT INTO public.invoices (
        organization_id,
        invoice_number,
        amount,
        description,
        due_date,
        status
    ) VALUES (
        org_id,
        invoice_number,
        amount,
        description,
        COALESCE(due_date, CURRENT_DATE + INTERVAL '30 days'),
        'PENDING'
    ) RETURNING id INTO invoice_id;
    
    RETURN invoice_id;
END;
$$;

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    invoice_seq INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1
    INTO invoice_seq
    FROM public.invoices
    WHERE invoice_number LIKE 'INV%';
    
    -- Generate invoice number: INV + 8 digits
    invoice_number := 'INV' || LPAD(invoice_seq::TEXT, 8, '0');
    
    RETURN invoice_number;
END;
$$;

-- =============================================================================
-- DASHBOARD AND REPORTING FUNCTIONS
-- =============================================================================

-- Fix get_dashboard_stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    org_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSON;
    total_requests INTEGER := 0;
    approved_requests INTEGER := 0;
    declined_requests INTEGER := 0;
    pending_requests INTEGER := 0;
    total_cost_saving DECIMAL := 0;
    total_co2_saving DECIMAL := 0;
    approval_rate DECIMAL := 0;
    org_role TEXT;
BEGIN
    -- Get organization role
    SELECT type INTO org_role 
    FROM public.organizations 
    WHERE id = org_id;
    
    -- Set default date range if not provided (last 30 days)
    IF start_date IS NULL THEN
        start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    -- Calculate KPIs based on organization role
    IF org_role = 'TRUCKING_COMPANY' THEN
        -- For dispatchers: requests they created
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'APPROVED'),
            COUNT(*) FILTER (WHERE status = 'DECLINED'),
            COUNT(*) FILTER (WHERE status = 'PENDING'),
            COALESCE(SUM(estimated_cost_saving), 0),
            COALESCE(SUM(estimated_co2_saving_kg), 0)
        INTO 
            total_requests,
            approved_requests,
            declined_requests,
            pending_requests,
            total_cost_saving,
            total_co2_saving
        FROM public.street_turn_requests
        WHERE requesting_org_id = org_id
        AND created_at::DATE BETWEEN start_date AND end_date;
    ELSE
        -- For carriers: requests they need to approve
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'APPROVED'),
            COUNT(*) FILTER (WHERE status = 'DECLINED'),
            COUNT(*) FILTER (WHERE status = 'PENDING'),
            COALESCE(SUM(estimated_cost_saving), 0),
            COALESCE(SUM(estimated_co2_saving_kg), 0)
        INTO 
            total_requests,
            approved_requests,
            declined_requests,
            pending_requests,
            total_cost_saving,
            total_co2_saving
        FROM public.street_turn_requests
        WHERE approving_org_id = org_id
        AND created_at::DATE BETWEEN start_date AND end_date;
    END IF;
    
    -- Calculate approval rate
    IF total_requests > 0 THEN
        approval_rate := ROUND((approved_requests::DECIMAL / total_requests::DECIMAL) * 100, 2);
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'total_requests', total_requests,
        'approved_requests', approved_requests,
        'declined_requests', declined_requests,
        'pending_requests', pending_requests,
        'approval_rate', approval_rate,
        'total_cost_saving', total_cost_saving,
        'total_co2_saving', total_co2_saving,
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        )
    );
    
    RETURN result;
END;
$$;

-- Fix get_dashboard_trend_data function
CREATE OR REPLACE FUNCTION public.get_dashboard_trend_data(
    org_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSON;
    org_role TEXT;
BEGIN
    -- Get organization role
    SELECT type INTO org_role 
    FROM public.organizations 
    WHERE id = org_id;
    
    -- Generate trend data based on role
    IF org_role = 'TRUCKING_COMPANY' THEN
        WITH daily_stats AS (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_requests,
                COALESCE(SUM(estimated_cost_saving), 0) as cost_saving
            FROM public.street_turn_requests
            WHERE requesting_org_id = org_id
            AND created_at >= CURRENT_DATE - INTERVAL '%s days'
            GROUP BY DATE(created_at)
            ORDER BY date
        )
        SELECT json_agg(
            json_build_object(
                'date', date,
                'total_requests', total_requests,
                'approved_requests', approved_requests,
                'cost_saving', cost_saving
            )
        ) INTO result
        FROM daily_stats;
    ELSE
        WITH daily_stats AS (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_requests,
                COALESCE(SUM(estimated_cost_saving), 0) as cost_saving
            FROM public.street_turn_requests
            WHERE approving_org_id = org_id
            AND created_at >= CURRENT_DATE - INTERVAL '%s days'
            GROUP BY DATE(created_at)
            ORDER BY date
        )
        SELECT json_agg(
            json_build_object(
                'date', date,
                'total_requests', total_requests,
                'approved_requests', approved_requests,
                'cost_saving', cost_saving
            )
        ) INTO result
        FROM daily_stats;
    END IF;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Fix get_carrier_kpis function
CREATE OR REPLACE FUNCTION public.get_carrier_kpis(
    carrier_org_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSON;
    total_containers INTEGER;
    available_containers INTEGER;
    cod_requests INTEGER;
    pending_cod_requests INTEGER;
BEGIN
    -- Get container statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'AVAILABLE')
    INTO 
        total_containers,
        available_containers
    FROM public.import_containers
    WHERE shipping_line_org_id = carrier_org_id;
    
    -- Get COD request statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'PENDING')
    INTO 
        cod_requests,
        pending_cod_requests
    FROM public.cod_requests cr
    JOIN public.import_containers ic ON cr.dropoff_order_id = ic.id
    WHERE ic.shipping_line_org_id = carrier_org_id;
    
    -- Build result
    result := json_build_object(
        'total_containers', total_containers,
        'available_containers', available_containers,
        'cod_requests', cod_requests,
        'pending_cod_requests', pending_cod_requests
    );
    
    RETURN result;
END;
$$;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Fix calculate_distance_km function (if exists)
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    earth_radius CONSTANT NUMERIC := 6371; -- Earth radius in kilometers
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$;

-- Fix generate_vietqr_code function
CREATE OR REPLACE FUNCTION public.generate_vietqr_code(
    bank_code TEXT,
    account_number TEXT,
    amount NUMERIC,
    description TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    qr_string TEXT;
BEGIN
    -- Generate VietQR string format
    qr_string := format(
        '00020101021238570010A00000072701270006%s01%s%s0208QRIBFTTA53037045802VN5925%s6304',
        bank_code,
        length(account_number)::TEXT,
        account_number,
        description
    );
    
    RETURN qr_string;
END;
$$;

-- Fix is_carrier_admin function
CREATE OR REPLACE FUNCTION public.is_carrier_admin(
    user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_role TEXT;
    org_type TEXT;
BEGIN
    SELECT p.role::TEXT, o.type
    INTO user_role, org_type
    FROM public.profiles p
    JOIN public.organizations o ON p.organization_id = o.id
    WHERE p.id = user_id;
    
    RETURN (user_role = 'ADMIN' AND org_type = 'SHIPPING_LINE');
END;
$$;

-- Fix fuzzy_search_organizations function
CREATE OR REPLACE FUNCTION public.fuzzy_search_organizations(
    search_term TEXT
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    type TEXT,
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
        o.type::TEXT,
        similarity(o.name, search_term) as similarity_score
    FROM public.organizations o
    WHERE similarity(o.name, search_term) > 0.3
    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$;

-- Fix get_shipping_lines_for_filter function
CREATE OR REPLACE FUNCTION public.get_shipping_lines_for_filter()
RETURNS TABLE(
    id UUID,
    name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name
    FROM public.organizations o
    WHERE o.type = 'SHIPPING_LINE'
    ORDER BY o.name;
END;
$$;

-- Fix validate_shipping_line_type function
CREATE OR REPLACE FUNCTION public.validate_shipping_line_type(
    org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    org_type TEXT;
BEGIN
    SELECT type INTO org_type
    FROM public.organizations
    WHERE id = org_id;
    
    RETURN (org_type = 'SHIPPING_LINE');
END;
$$;

-- Fix generate_additional_tasks function
CREATE OR REPLACE FUNCTION public.generate_additional_tasks(
    dropoff_order_id UUID,
    pickup_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    tasks JSONB := '[]'::jsonb;
BEGIN
    -- Generate basic tasks based on container and booking details
    tasks := tasks || jsonb_build_array(
        jsonb_build_object(
            'type', 'CONTAINER_INSPECTION',
            'description', 'Inspect container condition before pickup',
            'required', true
        ),
        jsonb_build_object(
            'type', 'DOCUMENTATION_CHECK',
            'description', 'Verify all required documents',
            'required', true
        )
    );
    
    RETURN tasks;
END;
$$;

-- Fix get_marketplace_listings_with_rating function
CREATE OR REPLACE FUNCTION public.get_marketplace_listings_with_rating(
    min_rating_value NUMERIC DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    container_number VARCHAR,
    container_type VARCHAR,
    drop_off_location TEXT,
    available_from_datetime TIMESTAMPTZ,
    latitude NUMERIC,
    longitude NUMERIC,
    shipping_line_org_id UUID,
    trucking_company_org_id UUID,
    status VARCHAR,
    is_listed_on_marketplace BOOLEAN,
    created_at TIMESTAMPTZ,
    avg_rating NUMERIC,
    review_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ic.id,
        ic.container_number,
        ic.container_type,
        ic.drop_off_location,
        ic.available_from_datetime,
        ic.latitude,
        ic.longitude,
        ic.shipping_line_org_id,
        ic.trucking_company_org_id,
        ic.status,
        ic.is_listed_on_marketplace,
        ic.created_at,
        COALESCE(r.avg_rating, 0) as avg_rating,
        COALESCE(r.review_count, 0) as review_count
    FROM public.import_containers ic
    LEFT JOIN (
        SELECT 
            reviewee_org_id,
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
        FROM public.partner_reviews
        GROUP BY reviewee_org_id
    ) r ON ic.trucking_company_org_id = r.reviewee_org_id
    WHERE 
        ic.is_listed_on_marketplace = true
        AND ic.status = 'AVAILABLE'
        AND COALESCE(r.avg_rating, 0) >= min_rating_value;
END;
$$;

-- Fix create_prepaid_fund_for_organization function
CREATE OR REPLACE FUNCTION public.create_prepaid_fund_for_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    fund_code_seq INTEGER;
    generated_fund_code TEXT;
BEGIN
    -- Tạo mã quỹ tự động: LP + 7 chữ số
    SELECT COALESCE(MAX(CAST(SUBSTRING(fund_code FROM 3) AS INTEGER)), 0) + 1
    INTO fund_code_seq
    FROM public.organization_prepaid_funds
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
$$;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Function search_path security fixes completed successfully!';
    RAISE NOTICE 'All functions now have SECURITY DEFINER and SET search_path = "" for enhanced security.';
END
$$;