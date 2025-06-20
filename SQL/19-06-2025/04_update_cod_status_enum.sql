-- =====================================================
-- UPDATE COD REQUEST STATUS ENUM
-- File: 04_update_cod_status_enum.sql
-- Purpose: Bổ sung các trạng thái mới cho luồng nghiệp vụ COD
-- Date: 19-06-2025
-- =====================================================

-- Thêm các trạng thái mới vào enum cod_request_status
-- Theo luồng nghiệp vụ chi tiết trong file "3. COD Flow.md"

-- 1. Thêm PENDING_PAYMENT - sau khi xác nhận đã giao trả
ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';

-- 2. Thêm PAID - sau khi LTA Admin xác nhận thanh toán
ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PAID';

-- 3. Thêm PROCESSING_AT_DEPOT - khi container đang được xử lý tại depot
ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PROCESSING_AT_DEPOT';

-- 4. Thêm COMPLETED - khi e-Depot báo hiệu xử lý xong
ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Cập nhật comment cho enum
COMMENT ON TYPE public.cod_request_status IS 'Trạng thái của yêu cầu thay đổi nơi trả container (COD) - Bao gồm đầy đủ luồng từ tạo yêu cầu đến hoàn tất';

-- Thêm các action tương ứng vào audit log enum
ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'DELIVERY_CONFIRMED';
ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'PAYMENT_CONFIRMED';
ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'DEPOT_PROCESSING_STARTED';
ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Cập nhật comment cho audit log action
COMMENT ON TYPE public.audit_log_action IS 'Các hành động có thể thực hiện trên yêu cầu COD - Bao gồm đầy đủ luồng nghiệp vụ';

-- Kiểm tra dữ liệu hiện tại trước khi thêm constraint
DO $$
DECLARE
    pending_count INTEGER;
    approved_count INTEGER;
    declined_count INTEGER;
    other_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_count FROM public.cod_requests WHERE status = 'PENDING';
    SELECT COUNT(*) INTO approved_count FROM public.cod_requests WHERE status = 'APPROVED';
    SELECT COUNT(*) INTO declined_count FROM public.cod_requests WHERE status = 'DECLINED';
    SELECT COUNT(*) INTO other_count FROM public.cod_requests WHERE status NOT IN ('PENDING', 'APPROVED', 'DECLINED');
    
    RAISE NOTICE 'Current COD requests data:';
    RAISE NOTICE '- PENDING: %', pending_count;
    RAISE NOTICE '- APPROVED: %', approved_count;
    RAISE NOTICE '- DECLINED: %', declined_count;
    RAISE NOTICE '- OTHER: %', other_count;
END $$;

-- Kiểm tra và xóa các view có thể conflict trước khi thêm cột
DO $$
DECLARE
    view_count INTEGER;
    record RECORD;
BEGIN
    -- Kiểm tra views hiện tại liên quan đến cod_requests
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND view_definition LIKE '%cod_requests%';
    
    RAISE NOTICE 'Found % views referencing cod_requests table', view_count;
    
    -- List các views để tham khảo
    FOR record IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND view_definition LIKE '%cod_requests%'
    LOOP
        RAISE NOTICE 'Dropping view: %', record.table_name;
    END LOOP;
END $$;

-- Xóa tất cả views và dependencies có thể conflict
DROP VIEW IF EXISTS public.cod_request_flow_view CASCADE;
DROP VIEW IF EXISTS public.cod_dashboard_view CASCADE;
DROP VIEW IF EXISTS public.cod_summary_view CASCADE;
DROP VIEW IF EXISTS public.cod_requests_view CASCADE;
DROP VIEW IF EXISTS public.cod_monitoring_view CASCADE;

-- Xóa tất cả materialized views nếu có
DROP MATERIALIZED VIEW IF EXISTS public.cod_request_flow_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.cod_dashboard_view CASCADE;

-- Xóa functions có thể dependency
DROP FUNCTION IF EXISTS public.get_cod_request_summary CASCADE;
DROP FUNCTION IF EXISTS public.cod_request_status_summary CASCADE;

-- Thêm các cột mới vào bảng cod_requests để theo dõi thời gian
ALTER TABLE public.cod_requests 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS depot_processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Thêm comment cho các cột mới
COMMENT ON COLUMN public.cod_requests.approved_at IS 'Thời điểm phê duyệt yêu cầu';
COMMENT ON COLUMN public.cod_requests.declined_at IS 'Thời điểm từ chối yêu cầu';
COMMENT ON COLUMN public.cod_requests.delivery_confirmed_at IS 'Thời điểm dispatcher xác nhận đã giao trả container';
COMMENT ON COLUMN public.cod_requests.payment_confirmed_at IS 'Thời điểm LTA Admin xác nhận đã thanh toán';
COMMENT ON COLUMN public.cod_requests.depot_processing_started_at IS 'Thời điểm bắt đầu xử lý tại depot';
COMMENT ON COLUMN public.cod_requests.completed_at IS 'Thời điểm hoàn tất toàn bộ quy trình COD';

-- Cập nhật constraint để bao gồm các trạng thái mới
-- Trước tiên, xóa constraint cũ nếu có
ALTER TABLE public.cod_requests DROP CONSTRAINT IF EXISTS valid_status_transitions;

-- Cập nhật dữ liệu cũ để phù hợp với constraint mới
-- Thêm approved_at cho các record APPROVED
UPDATE public.cod_requests 
SET approved_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'APPROVED' AND approved_at IS NULL;

-- Thêm declined_at cho các record DECLINED
UPDATE public.cod_requests 
SET declined_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'DECLINED' AND declined_at IS NULL;

-- Log số record được cập nhật
DO $$
DECLARE
    updated_approved INTEGER;
    updated_declined INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_approved FROM public.cod_requests WHERE status = 'APPROVED' AND approved_at IS NOT NULL;
    SELECT COUNT(*) INTO updated_declined FROM public.cod_requests WHERE status = 'DECLINED' AND declined_at IS NOT NULL;
    
    RAISE NOTICE 'Updated timestamps:';
    RAISE NOTICE '- Records with approved_at: %', updated_approved;
    RAISE NOTICE '- Records with declined_at: %', updated_declined;
END $$;

-- Validation check trước khi thêm constraint
DO $$
DECLARE
    invalid_records INTEGER;
    record RECORD;
BEGIN
    -- Kiểm tra records có thể vi phạm constraint mới
    SELECT COUNT(*) INTO invalid_records
    FROM public.cod_requests
    WHERE NOT (
        (status = 'PENDING') OR
        (status = 'APPROVED') OR
        (status = 'DECLINED') OR
        (status = 'AWAITING_INFO') OR
        (status = 'EXPIRED') OR
        (status = 'REVERSED') OR
        (status = 'PENDING_PAYMENT' AND delivery_confirmed_at IS NOT NULL) OR
        (status = 'PAID' AND payment_confirmed_at IS NOT NULL) OR
        (status = 'PROCESSING_AT_DEPOT' AND depot_processing_started_at IS NOT NULL) OR
        (status = 'COMPLETED' AND completed_at IS NOT NULL)
    );
    
    IF invalid_records > 0 THEN
        RAISE NOTICE 'Found % records that may violate the new constraint', invalid_records;
        
        -- Log chi tiết các record có vấn đề
        RAISE NOTICE 'Invalid records details:';
        FOR record IN 
            SELECT id, status, approved_at, declined_at, delivery_confirmed_at, payment_confirmed_at, depot_processing_started_at, completed_at
            FROM public.cod_requests
            WHERE NOT (
                (status = 'PENDING') OR
                (status = 'APPROVED') OR
                (status = 'DECLINED') OR
                (status = 'AWAITING_INFO') OR
                (status = 'EXPIRED') OR
                (status = 'REVERSED') OR
                (status = 'PENDING_PAYMENT' AND delivery_confirmed_at IS NOT NULL) OR
                (status = 'PAID' AND payment_confirmed_at IS NOT NULL) OR
                (status = 'PROCESSING_AT_DEPOT' AND depot_processing_started_at IS NOT NULL) OR
                (status = 'COMPLETED' AND completed_at IS NOT NULL)
            )
        LOOP
            RAISE NOTICE 'ID: %, Status: %, approved_at: %, declined_at: %', 
                record.id, record.status, record.approved_at, record.declined_at;
        END LOOP;
    ELSE
        RAISE NOTICE 'All records are valid for the new constraint!';
    END IF;
END $$;

-- Thêm constraint mới với điều kiện linh hoạt hơn cho dữ liệu legacy
ALTER TABLE public.cod_requests ADD CONSTRAINT valid_status_transitions CHECK (
    -- Trạng thái cơ bản
    (status = 'PENDING') OR
    (status = 'APPROVED') OR
    (status = 'DECLINED') OR
    (status = 'AWAITING_INFO') OR
    (status = 'EXPIRED') OR
    (status = 'REVERSED') OR
    -- Trạng thái mới cho luồng thanh toán và xử lý
    (status = 'PENDING_PAYMENT' AND delivery_confirmed_at IS NOT NULL) OR
    (status = 'PAID' AND payment_confirmed_at IS NOT NULL) OR
    (status = 'PROCESSING_AT_DEPOT' AND depot_processing_started_at IS NOT NULL) OR
    (status = 'COMPLETED' AND completed_at IS NOT NULL)
);

-- Tạo function helper để cập nhật trạng thái và timestamp
CREATE OR REPLACE FUNCTION public.update_cod_request_status(
    p_request_id UUID,
    p_new_status public.cod_request_status,
    p_actor_user_id UUID DEFAULT NULL,
    p_actor_org_name TEXT DEFAULT 'SYSTEM',
    p_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_status public.cod_request_status;
    timestamp_column TEXT;
    audit_action public.audit_log_action;
BEGIN
    -- Lấy trạng thái hiện tại
    SELECT status INTO old_status 
    FROM cod_requests 
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'COD request not found: %', p_request_id;
    END IF;
    
    -- Xác định cột timestamp và audit action
    CASE p_new_status
        WHEN 'APPROVED' THEN 
            timestamp_column := 'approved_at';
            audit_action := 'APPROVED';
        WHEN 'DECLINED' THEN
            timestamp_column := 'declined_at'; 
            audit_action := 'DECLINED';
        WHEN 'PENDING_PAYMENT' THEN
            timestamp_column := 'delivery_confirmed_at';
            audit_action := 'DELIVERY_CONFIRMED';
        WHEN 'PAID' THEN
            timestamp_column := 'payment_confirmed_at';
            audit_action := 'PAYMENT_CONFIRMED';
        WHEN 'PROCESSING_AT_DEPOT' THEN
            timestamp_column := 'depot_processing_started_at';
            audit_action := 'DEPOT_PROCESSING_STARTED';
        WHEN 'COMPLETED' THEN
            timestamp_column := 'completed_at';
            audit_action := 'COMPLETED';
        ELSE 
            timestamp_column := NULL;
            audit_action := p_new_status::TEXT::public.audit_log_action;
    END CASE;
    
    -- Cập nhật trạng thái
    IF timestamp_column IS NOT NULL THEN
        EXECUTE format('UPDATE cod_requests SET status = $1, %I = NOW() WHERE id = $2', timestamp_column)
        USING p_new_status, p_request_id;
    ELSE
        UPDATE cod_requests SET status = p_new_status WHERE id = p_request_id;
    END IF;
    
    -- Ghi audit log
    INSERT INTO cod_audit_logs (request_id, actor_user_id, actor_org_name, action, details)
    VALUES (p_request_id, p_actor_user_id, p_actor_org_name, audit_action, 
            COALESCE(p_details, jsonb_build_object(
                'old_status', old_status,
                'new_status', p_new_status,
                'timestamp', NOW()
            )));
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update COD request status: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_cod_request_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cod_request_status TO service_role;

-- Thêm comment cho function
COMMENT ON FUNCTION public.update_cod_request_status IS 'Helper function để cập nhật trạng thái COD request với timestamp tương ứng và ghi audit log';

-- Tạo view để theo dõi luồng nghiệp vụ COD
CREATE OR REPLACE VIEW public.cod_request_flow_view AS
SELECT 
    cr.id,
    cr.status,
    cr.created_at,
    cr.updated_at,
    cr.approved_at,
    cr.declined_at,
    cr.delivery_confirmed_at,
    cr.payment_confirmed_at,
    cr.depot_processing_started_at,
    cr.completed_at,
    -- Tính toán thời gian xử lý
    CASE 
        WHEN cr.completed_at IS NOT NULL THEN cr.completed_at - cr.created_at
        ELSE NOW() - cr.created_at 
    END as total_processing_time,
    -- Trạng thái hiện tại của luồng
    CASE cr.status
        WHEN 'PENDING' THEN 'Chờ phê duyệt'
        WHEN 'APPROVED' THEN 'Đã phê duyệt - Chờ giao trả'
        WHEN 'DECLINED' THEN 'Đã từ chối'
        WHEN 'PENDING_PAYMENT' THEN 'Chờ thanh toán'
        WHEN 'PAID' THEN 'Đã thanh toán - Chờ xử lý tại depot'
        WHEN 'PROCESSING_AT_DEPOT' THEN 'Đang xử lý tại depot'
        WHEN 'COMPLETED' THEN 'Hoàn tất'
        WHEN 'EXPIRED' THEN 'Đã hết hạn'
        WHEN 'REVERSED' THEN 'Đã hủy bỏ'
        ELSE 'Trạng thái không xác định'
    END as status_description,
    ic.container_number,
    ro.name as requesting_org_name,
    ao.name as approving_org_name
FROM cod_requests cr
LEFT JOIN import_containers ic ON cr.dropoff_order_id = ic.id
LEFT JOIN organizations ro ON cr.requesting_org_id = ro.id
LEFT JOIN organizations ao ON cr.approving_org_id = ao.id;

-- Grant permissions cho view
GRANT SELECT ON public.cod_request_flow_view TO authenticated;

-- Log hoàn thành
DO $$
BEGIN
    RAISE NOTICE '=== COD STATUS ENUM UPDATE COMPLETED ===';
    RAISE NOTICE 'Added statuses: PENDING_PAYMENT, PAID, PROCESSING_AT_DEPOT, COMPLETED';
    RAISE NOTICE 'Added audit actions: DELIVERY_CONFIRMED, PAYMENT_CONFIRMED, DEPOT_PROCESSING_STARTED, COMPLETED';
    RAISE NOTICE 'Added timestamp columns for tracking business flow';
    RAISE NOTICE 'Created helper function: update_cod_request_status()';
    RAISE NOTICE 'Created view: cod_request_flow_view';
END $$; 