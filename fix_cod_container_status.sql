-- Fix COD Container Status Flow
-- Đảm bảo container status được cập nhật đúng theo COD flow:
-- 1. AVAILABLE → AWAITING_COD_APPROVAL (khi submit COD form)
-- 2. AWAITING_COD_APPROVAL → COD_REJECTED (admin từ chối) OR AWAITING_COD_PAYMENT (admin duyệt)
-- 3. AWAITING_COD_PAYMENT → ON_GOING_COD (payment successful)
-- 4. ON_GOING_COD → PROCESSING (user confirms completion)
-- 5. PROCESSING → COMPLETED (depot processing done)

-- 1. Drop existing stored functions that may interfere
DROP FUNCTION IF EXISTS public.approve_cod_request(UUID, NUMERIC, UUID, TEXT);

-- 2. Create corrected stored function for COD approval
CREATE OR REPLACE FUNCTION public.approve_cod_request(
    request_id UUID,
    cod_fee NUMERIC DEFAULT 0,
    actor_user_id UUID DEFAULT NULL,
    actor_org_name TEXT DEFAULT 'Unknown'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cod_request RECORD;
    depot_info RECORD;
    container_info RECORD;
    update_count INTEGER;
    result JSON;
BEGIN
    -- Disable RLS để đảm bảo function có thể update
    SET LOCAL row_security = off;
    
    -- Lấy thông tin COD request và kiểm tra trạng thái
    SELECT 
        cr.id,
        cr.status,
        cr.dropoff_order_id,
        cr.requested_depot_id,
        cr.approving_org_id
    INTO cod_request
    FROM cod_requests cr
    WHERE cr.id = request_id;

    -- Kiểm tra request có tồn tại không
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Không tìm thấy yêu cầu COD với ID: ' || request_id
        );
    END IF;

    -- Kiểm tra trạng thái request
    IF cod_request.status NOT IN ('PENDING', 'AWAITING_INFO') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Yêu cầu này đã được xử lý (status: ' || cod_request.status || ') hoặc bị hủy'
        );
    END IF;

    -- Lấy thông tin depot mới
    SELECT 
        d.id,
        d.name,
        d.address,
        d.latitude,
        d.longitude
    INTO depot_info
    FROM depots d
    WHERE d.id = cod_request.requested_depot_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Depot được yêu cầu không tồn tại: ' || cod_request.requested_depot_id
        );
    END IF;

    -- Lấy thông tin container
    SELECT 
        ic.id,
        ic.container_number,
        ic.status
    INTO container_info
    FROM import_containers ic
    WHERE ic.id = cod_request.dropoff_order_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Container không tồn tại: ' || cod_request.dropoff_order_id
        );
    END IF;

    -- BƯỚC 1: Update COD request status
    UPDATE cod_requests 
    SET 
        status = 'APPROVED',
        cod_fee = approve_cod_request.cod_fee,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    IF update_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Không thể update COD request status'
        );
    END IF;

    -- BƯỚC 2: Update container với thông tin depot mới VÀ status AWAITING_COD_PAYMENT
    UPDATE import_containers 
    SET 
        depot_id = cod_request.requested_depot_id,
        drop_off_location = depot_info.name || ', ' || depot_info.address,
        latitude = depot_info.latitude,
        longitude = depot_info.longitude,
        status = 'AWAITING_COD_PAYMENT'  -- QUAN TRỌNG: Cập nhật đúng theo COD flow
    WHERE id = cod_request.dropoff_order_id;

    GET DIAGNOSTICS update_count = ROW_COUNT;
    IF update_count = 0 THEN
        -- Rollback COD request nếu container update fail
        UPDATE cod_requests 
        SET status = 'PENDING' 
        WHERE id = request_id;
        
        RETURN json_build_object(
            'success', false,
            'message', 'Không thể update container - đã rollback COD request về PENDING'
        );
    END IF;

    -- BƯỚC 3: Ghi audit log
    INSERT INTO cod_audit_logs (
        request_id,
        actor_user_id,
        actor_org_name,
        action,
        details,
        created_at
    ) VALUES (
        request_id,
        actor_user_id,
        actor_org_name,
        'APPROVED',
        jsonb_build_object(
            'container_number', container_info.container_number,
            'decision', 'APPROVED',
            'cod_fee', cod_fee,
            'depot_name', depot_info.name,
            'depot_address', depot_info.address
        ),
        NOW()
    );

    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'COD request approved successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback on any error
        ROLLBACK;
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- 3. Create function to handle COD rejection
CREATE OR REPLACE FUNCTION public.reject_cod_request(
    request_id UUID,
    reason_for_decision TEXT DEFAULT NULL,
    actor_user_id UUID DEFAULT NULL,
    actor_org_name TEXT DEFAULT 'Unknown'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cod_request RECORD;
    container_info RECORD;
    update_count INTEGER;
BEGIN
    -- Disable RLS để đảm bảo function có thể update
    SET LOCAL row_security = off;
    
    -- Lấy thông tin COD request
    SELECT 
        cr.id,
        cr.status,
        cr.dropoff_order_id
    INTO cod_request
    FROM cod_requests cr
    WHERE cr.id = request_id;

    -- Kiểm tra request có tồn tại không
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Không tìm thấy yêu cầu COD với ID: ' || request_id
        );
    END IF;

    -- Kiểm tra trạng thái request
    IF cod_request.status NOT IN ('PENDING', 'AWAITING_INFO') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Yêu cầu này đã được xử lý hoặc bị hủy'
        );
    END IF;

    -- Lấy thông tin container
    SELECT 
        ic.id,
        ic.container_number,
        ic.status
    INTO container_info
    FROM import_containers ic
    WHERE ic.id = cod_request.dropoff_order_id;

    -- BƯỚC 1: Update COD request status to DECLINED
    UPDATE cod_requests 
    SET 
        status = 'DECLINED',
        reason_for_decision = reject_cod_request.reason_for_decision,
        declined_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;

    -- BƯỚC 2: Update container status to COD_REJECTED
    UPDATE import_containers 
    SET 
        status = 'COD_REJECTED'
    WHERE id = cod_request.dropoff_order_id;

    -- BƯỚC 3: Ghi audit log
    INSERT INTO cod_audit_logs (
        request_id,
        actor_user_id,
        actor_org_name,
        action,
        details,
        created_at
    ) VALUES (
        request_id,
        actor_user_id,
        actor_org_name,
        'DECLINED',
        jsonb_build_object(
            'container_number', container_info.container_number,
            'decision', 'DECLINED',
            'reason_for_decision', reason_for_decision
        ),
        NOW()
    );

    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'COD request rejected successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- 4. Create trigger to ensure container status consistency
CREATE OR REPLACE FUNCTION check_cod_container_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ áp dụng cho COD-related status changes - chỉ debug log, không ghi audit
    IF NEW.status IN ('AWAITING_COD_APPROVAL', 'AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'COD_REJECTED') THEN
        -- Log to database log for debugging (không vào audit table vì enum conflict)
        RAISE NOTICE 'COD Container Status Change: Container % (%) changed from % to %', 
            NEW.container_number, NEW.id, OLD.status, NEW.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS cod_container_status_trigger ON import_containers;

-- Create trigger
CREATE TRIGGER cod_container_status_trigger
    AFTER UPDATE OF status ON import_containers
    FOR EACH ROW
    EXECUTE FUNCTION check_cod_container_status();

-- 5. Update any existing containers that might be in wrong status
-- This will fix any containers currently stuck in wrong status
UPDATE import_containers 
SET status = 'AWAITING_COD_PAYMENT'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'APPROVED' 
    AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'DEPOT_PROCESSING', 'COMPLETED')
);

-- 6. Comment về cách sử dụng
/*
CÁCH SỬ DỤNG:

1. Approve COD:
   SELECT approve_cod_request('request-uuid-here', 50000, 'user-uuid', 'Org Name');

2. Reject COD:
   SELECT reject_cod_request('request-uuid-here', 'Reason here', 'user-uuid', 'Org Name');

3. Kiểm tra status:
   SELECT 
     cr.id, cr.status as cod_status, 
     ic.container_number, ic.status as container_status
   FROM cod_requests cr
   JOIN import_containers ic ON cr.dropoff_order_id = ic.id
   WHERE cr.id = 'request-uuid-here';
*/ 