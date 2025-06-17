-- Tạo function để handle COD approval với transaction đầy đủ
-- Function này sẽ được gọi từ client để đảm bảo tính nhất quán dữ liệu

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
    result JSON;
BEGIN
    -- Bắt đầu transaction
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
            'message', 'Không tìm thấy yêu cầu COD'
        );
    END IF;

    -- Kiểm tra trạng thái request
    IF cod_request.status NOT IN ('PENDING', 'AWAITING_INFO') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Yêu cầu này đã được xử lý hoặc bị hủy'
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
            'message', 'Depot được yêu cầu không tồn tại'
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
            'message', 'Container không tồn tại'
        );
    END IF;

    -- BƯỚC 1: Update COD request status
    UPDATE cod_requests 
    SET 
        status = 'APPROVED',
        cod_fee = approve_cod_request.cod_fee,
        updated_at = NOW()
    WHERE id = request_id;

    -- BƯỚC 2: Update container với thông tin depot mới
    UPDATE import_containers 
    SET 
        depot_id = cod_request.requested_depot_id,
        drop_off_location = depot_info.name || ', ' || depot_info.address,
        latitude = depot_info.latitude,
        longitude = depot_info.longitude,
        status = 'AVAILABLE'
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

    -- Trả về kết quả thành công
    RETURN json_build_object(
        'success', true,
        'message', 'Đã phê duyệt yêu cầu COD cho container ' || container_info.container_number || 
                   CASE WHEN cod_fee > 0 THEN ' với phí ' || cod_fee::text || ' VNĐ' ELSE '' END,
        'data', jsonb_build_object(
            'request_id', request_id,
            'container_number', container_info.container_number,
            'depot_name', depot_info.name
        )
    );

EXCEPTION WHEN OTHERS THEN
    -- Rollback sẽ tự động xảy ra khi có exception
    RETURN json_build_object(
        'success', false,
        'message', 'Có lỗi xảy ra khi phê duyệt: ' || SQLERRM
    );
END;
$$;

-- Cấp quyền cho authenticated users
GRANT EXECUTE ON FUNCTION public.approve_cod_request TO authenticated;

-- Tạo function để fix COD request cụ thể
CREATE OR REPLACE FUNCTION public.fix_cod_request_eb32874b()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Gọi function approve với request ID cụ thể
    SELECT approve_cod_request(
        'eb32874b-8bb7-4efd-8b06-cc150ad4388d'::UUID,
        0::NUMERIC,
        NULL::UUID,
        'MANUAL_FIX'::TEXT
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Cấp quyền
GRANT EXECUTE ON FUNCTION public.fix_cod_request_eb32874b TO authenticated;

-- Test function ngay
SELECT public.fix_cod_request_eb32874b(); 