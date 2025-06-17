-- Tạo function để fix COD request đã approved nhưng container chưa update

CREATE OR REPLACE FUNCTION public.fix_approved_cod_request(
    request_id UUID
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
    -- Lấy thông tin COD request
    SELECT 
        cr.id,
        cr.status,
        cr.dropoff_order_id,
        cr.requested_depot_id,
        cr.cod_fee
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

    -- Kiểm tra request đã approved chưa
    IF cod_request.status != 'APPROVED' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'COD request chưa được approved'
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
        ic.status,
        ic.depot_id
    INTO container_info
    FROM import_containers ic
    WHERE ic.id = cod_request.dropoff_order_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Container không tồn tại'
        );
    END IF;

    -- Kiểm tra container đã được update chưa
    IF container_info.depot_id = cod_request.requested_depot_id AND container_info.status = 'AVAILABLE' THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Container đã được update đúng depot rồi',
            'data', jsonb_build_object(
                'container_number', container_info.container_number,
                'depot_name', depot_info.name,
                'already_updated', true
            )
        );
    END IF;

    -- Update container với thông tin depot mới
    UPDATE import_containers 
    SET 
        depot_id = cod_request.requested_depot_id,
        drop_off_location = depot_info.name || ', ' || depot_info.address,
        latitude = depot_info.latitude,
        longitude = depot_info.longitude,
        status = 'AVAILABLE'
    WHERE id = cod_request.dropoff_order_id;

    -- Ghi audit log với action hợp lệ
    INSERT INTO cod_audit_logs (
        request_id,
        actor_user_id,
        actor_org_name,
        action,
        details,
        created_at
    ) VALUES (
        request_id,
        NULL,
        'SYSTEM_FIX',
        'APPROVED', -- Sử dụng action đã có
        jsonb_build_object(
            'container_number', container_info.container_number,
            'reason', 'Fix approved COD - container sync',
            'depot_name', depot_info.name,
            'depot_address', depot_info.address,
            'fixed_at', NOW()
        ),
        NOW()
    );

    -- Trả về kết quả thành công
    RETURN json_build_object(
        'success', true,
        'message', 'Đã sync container với COD request thành công',
        'data', jsonb_build_object(
            'request_id', request_id,
            'container_number', container_info.container_number,
            'depot_name', depot_info.name,
            'old_depot_id', container_info.depot_id,
            'new_depot_id', cod_request.requested_depot_id
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', 'Có lỗi xảy ra khi sync container: ' || SQLERRM
    );
END;
$$;

-- Cấp quyền
GRANT EXECUTE ON FUNCTION public.fix_approved_cod_request TO authenticated;

-- Test function với request cụ thể
SELECT public.fix_approved_cod_request('eb32874b-8bb7-4efd-8b06-cc150ad4388d'::UUID); 