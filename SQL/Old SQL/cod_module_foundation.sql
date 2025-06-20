-- =====================================================
-- COD MODULE FOUNDATION - Database Schema
-- Module: Change of Destination (COD)
-- Version: 1.0
-- Description: Tạo nền móng cơ sở dữ liệu cho module COD
-- =====================================================

-- 1. TẠO ENUM CHO TRẠNG THÁI YÊU CẦU COD
-- Bao gồm tất cả trạng thái từ cơ bản đến nâng cao
CREATE TYPE public.cod_request_status AS ENUM (
    'PENDING',          -- Đang chờ duyệt
    'APPROVED',         -- Đã phê duyệt
    'DECLINED',         -- Đã từ chối
    'AWAITING_INFO',    -- Chờ bổ sung thông tin
    'EXPIRED',          -- Hết hạn (sau 24h)
    'REVERSED'          -- Đã hủy bỏ sau khi duyệt
);

COMMENT ON TYPE public.cod_request_status IS 'Trạng thái của yêu cầu thay đổi nơi trả container (COD)';

-- 2. TẠO ENUM CHO AUDIT LOG ACTIONS
-- Ghi lại tất cả hành động có thể xảy ra với yêu cầu COD
CREATE TYPE public.audit_log_action AS ENUM (
    'CREATED',          -- Tạo yêu cầu mới
    'APPROVED',         -- Phê duyệt yêu cầu
    'DECLINED',         -- Từ chối yêu cầu
    'INFO_REQUESTED',   -- Yêu cầu bổ sung thông tin
    'INFO_SUBMITTED',   -- Gửi thông tin bổ sung
    'EXPIRED',          -- Hết hạn tự động
    'REVERSED',         -- Hủy bỏ sau khi duyệt
    'CANCELLED'         -- Hủy bởi người tạo
);

COMMENT ON TYPE public.audit_log_action IS 'Các hành động có thể thực hiện trên yêu cầu COD';

-- 3. THÊM TRẠNG THÁI MỚI VÀO ENUM ASSET_STATUS HIỆN CÓ
-- Kiểm tra xem enum asset_status đã tồn tại chưa
DO $$
BEGIN
    -- Thêm trạng thái AWAITING_COD_APPROVAL vào enum asset_status
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'AWAITING_COD_APPROVAL' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'asset_status')
    ) THEN
        ALTER TYPE public.asset_status ADD VALUE 'AWAITING_COD_APPROVAL';
    END IF;
END $$;

COMMENT ON TYPE public.asset_status IS 'Trạng thái của container - đã bổ sung AWAITING_COD_APPROVAL cho module COD';

-- 4. TẠO BẢNG CHÍNH: COD_REQUESTS
-- Lưu trữ tất cả yêu cầu thay đổi nơi trả container
CREATE TABLE public.cod_requests (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Liên kết với lệnh giao trả gốc
    dropoff_order_id UUID NOT NULL REFERENCES public.import_containers(id) ON DELETE CASCADE,
    
    -- Thông tin tổ chức
    requesting_org_id UUID NOT NULL REFERENCES public.organizations(id),
    approving_org_id UUID NOT NULL REFERENCES public.organizations(id),
    
    -- Thông tin địa điểm
    original_depot_address TEXT NOT NULL, -- Lưu lại địa chỉ depot gốc để hiển thị
    requested_depot_id UUID NOT NULL REFERENCES public.depots(id),
    
    -- Trạng thái và xử lý
    status public.cod_request_status NOT NULL DEFAULT 'PENDING',
    cod_fee NUMERIC(12,2), -- Phí COD do hãng tàu nhập (VNĐ)
    
    -- Thông tin mô tả
    reason_for_request TEXT, -- Lý do từ phía công ty vận tải
    reason_for_decision TEXT, -- Lý do phê duyệt/từ chối từ phía hãng tàu
    carrier_comment TEXT, -- Comment từ hãng tàu khi yêu cầu bổ sung thông tin
    additional_info TEXT, -- Thông tin bổ sung từ dispatcher
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'), -- Tự động hết hạn sau 24h
    
    -- Constraints
    CONSTRAINT cod_fee_positive CHECK (cod_fee IS NULL OR cod_fee >= 0),
    CONSTRAINT valid_status_transitions CHECK (
        -- Đảm bảo logic chuyển trạng thái hợp lệ
        (status = 'PENDING') OR
        (status = 'APPROVED' AND cod_fee IS NOT NULL) OR
        (status = 'DECLINED' AND reason_for_decision IS NOT NULL) OR
        (status = 'AWAITING_INFO' AND carrier_comment IS NOT NULL) OR
        (status = 'EXPIRED') OR
        (status = 'REVERSED')
    )
);

-- Thêm comment cho bảng và các cột quan trọng
COMMENT ON TABLE public.cod_requests IS 'Lưu trữ các yêu cầu thay đổi nơi trả container rỗng (Change of Destination)';
COMMENT ON COLUMN public.cod_requests.dropoff_order_id IS 'ID của lệnh giao trả container gốc';
COMMENT ON COLUMN public.cod_requests.requesting_org_id IS 'ID công ty vận tải tạo yêu cầu';
COMMENT ON COLUMN public.cod_requests.approving_org_id IS 'ID hãng tàu xử lý yêu cầu';
COMMENT ON COLUMN public.cod_requests.original_depot_address IS 'Địa chỉ depot gốc (lưu để hiển thị)';
COMMENT ON COLUMN public.cod_requests.requested_depot_id IS 'ID depot mới mong muốn';
COMMENT ON COLUMN public.cod_requests.cod_fee IS 'Phí COD tính bằng VNĐ';
COMMENT ON COLUMN public.cod_requests.expires_at IS 'Thời điểm yêu cầu hết hạn (24h sau khi tạo)';

-- 5. TẠO BẢNG AUDIT LOG
-- Ghi lại lịch sử tất cả hành động trên yêu cầu COD
CREATE TABLE public.cod_audit_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Liên kết với yêu cầu COD
    request_id UUID NOT NULL REFERENCES public.cod_requests(id) ON DELETE CASCADE,
    
    -- Thông tin người thực hiện
    actor_user_id UUID REFERENCES auth.users(id),
    actor_org_name TEXT NOT NULL, -- Tên công ty của người thực hiện
    
    -- Hành động và chi tiết
    action public.audit_log_action NOT NULL,
    details JSONB, -- Lưu các thông tin phụ như: { "fee": 200000, "reason": "...", "old_status": "PENDING", "new_status": "APPROVED" }
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thêm comment cho bảng audit log
COMMENT ON TABLE public.cod_audit_logs IS 'Lịch sử các hành động trên yêu cầu COD - phục vụ kiểm toán và giải quyết tranh chấp';
COMMENT ON COLUMN public.cod_audit_logs.request_id IS 'ID yêu cầu COD liên quan';
COMMENT ON COLUMN public.cod_audit_logs.actor_user_id IS 'ID người dùng thực hiện hành động';
COMMENT ON COLUMN public.cod_audit_logs.actor_org_name IS 'Tên công ty của người thực hiện';
COMMENT ON COLUMN public.cod_audit_logs.details IS 'Chi tiết hành động dưới dạng JSON';

-- 6. TẠO INDEXES ĐỂ TỐI ƯU PERFORMANCE
-- Index cho bảng cod_requests
CREATE INDEX idx_cod_requests_status ON public.cod_requests(status);
CREATE INDEX idx_cod_requests_requesting_org ON public.cod_requests(requesting_org_id);
CREATE INDEX idx_cod_requests_approving_org ON public.cod_requests(approving_org_id);
CREATE INDEX idx_cod_requests_dropoff_order ON public.cod_requests(dropoff_order_id);
CREATE INDEX idx_cod_requests_created_at ON public.cod_requests(created_at);
CREATE INDEX idx_cod_requests_expires_at ON public.cod_requests(expires_at) WHERE status = 'PENDING';

-- Index cho bảng cod_audit_logs
CREATE INDEX idx_cod_audit_logs_request_id ON public.cod_audit_logs(request_id);
CREATE INDEX idx_cod_audit_logs_created_at ON public.cod_audit_logs(created_at);
CREATE INDEX idx_cod_audit_logs_action ON public.cod_audit_logs(action);

-- 7. THIẾT LẬP ROW LEVEL SECURITY (RLS)
-- Bật RLS cho bảng cod_requests
ALTER TABLE public.cod_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ các bên liên quan mới có thể truy cập yêu cầu COD
CREATE POLICY "Involved parties can access COD requests" ON public.cod_requests
FOR ALL USING (
    (requesting_org_id = public.get_current_org_id()) OR 
    (approving_org_id = public.get_current_org_id())
);

-- Bật RLS cho bảng cod_audit_logs
ALTER TABLE public.cod_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ các bên liên quan có thể xem audit logs
CREATE POLICY "Involved parties can view COD audit logs" ON public.cod_audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.cod_requests cr 
        WHERE cr.id = cod_audit_logs.request_id 
        AND (cr.requesting_org_id = public.get_current_org_id() OR cr.approving_org_id = public.get_current_org_id())
    )
);

-- Policy: Chỉ hệ thống có thể tạo audit logs (thông qua server actions)
CREATE POLICY "System can insert COD audit logs" ON public.cod_audit_logs
FOR INSERT WITH CHECK (true);

-- 8. TẠO TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
-- Function để cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho bảng cod_requests
CREATE TRIGGER update_cod_requests_updated_at
    BEFORE UPDATE ON public.cod_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. TẠO FUNCTION XỬ LÝ HẾT HẠN TỰ ĐỘNG
-- Function để xử lý các yêu cầu COD hết hạn
CREATE OR REPLACE FUNCTION public.expire_old_cod_requests()
RETURNS VOID AS $$
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
            '{"reason": "Auto-expired after 24 hours", "expired_at": "' || NOW() || '"}'::jsonb
        );
    END LOOP;
    
    -- Log số lượng yêu cầu đã xử lý
    RAISE NOTICE 'Processed % expired COD requests', 
        (SELECT COUNT(*) FROM public.cod_requests WHERE status = 'EXPIRED' AND updated_at > NOW() - INTERVAL '1 minute');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.expire_old_cod_requests() IS 'Xử lý tự động các yêu cầu COD hết hạn - chạy bởi cron job';

-- 10. THÔNG BÁO HOÀN THÀNH
DO $$
BEGIN
    RAISE NOTICE '=== COD MODULE FOUNDATION SETUP COMPLETED ===';
    RAISE NOTICE 'Created ENUMs: cod_request_status, audit_log_action';
    RAISE NOTICE 'Updated ENUM: asset_status (added AWAITING_COD_APPROVAL)';
    RAISE NOTICE 'Created Tables: cod_requests, cod_audit_logs';
    RAISE NOTICE 'Created Indexes: 6 indexes for performance optimization';
    RAISE NOTICE 'Setup RLS: Policies for data security';
    RAISE NOTICE 'Created Functions: expire_old_cod_requests, update_updated_at_column';
    RAISE NOTICE 'Ready for COD Module implementation!';
END $$; 