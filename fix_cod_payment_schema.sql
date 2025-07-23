-- =====================================================
-- FIX COD PAYMENT SCHEMA & CREATE TEST DATA
-- =====================================================

-- 1. Tạo bảng gpg_depots nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.gpg_depots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    city_id UUID,
    contact_phone TEXT,
    contact_email TEXT,
    operating_hours TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS cho gpg_depots
ALTER TABLE public.gpg_depots ENABLE ROW LEVEL SECURITY;

-- 3. Tạo policy cho gpg_depots
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.gpg_depots
    FOR SELECT USING (true);

-- 4. Thêm dữ liệu mẫu cho gpg_depots
INSERT INTO public.gpg_depots (name, address, latitude, longitude) VALUES
    ('GPG Depot Hải Phòng', 'Khu công nghiệp Đình Vũ, Hải Phòng', 20.7851, 106.7267),
    ('GPG Depot TP.HCM', 'Cảng Cát Lái, TP. Hồ Chí Minh', 10.7769, 106.6951),
    ('GPG Depot Đà Nẵng', 'Cảng Tiên Sa, Đà Nẵng', 16.0544, 108.2022),
    ('GPG Depot Quy Nhon', 'Cảng Quy Nhon, Bình Định', 13.7563, 109.2297),
    ('GPG Depot Cần Thơ', 'Cảng Cần Thơ, Cần Thơ', 10.0452, 105.7469)
ON CONFLICT (id) DO NOTHING;

-- 5. Drop existing constraint pointing to depots table
DO $$
BEGIN
    -- Drop constraint cũ đến depots table
    ALTER TABLE cod_requests DROP CONSTRAINT IF EXISTS cod_requests_requested_depot_id_fkey;
    RAISE NOTICE 'Dropped old foreign key constraint pointing to depots table';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END $$;

-- 6. Tạo foreign key constraint mới đến gpg_depots
ALTER TABLE public.cod_requests
ADD CONSTRAINT cod_requests_requested_depot_id_fkey
FOREIGN KEY (requested_depot_id)
REFERENCES public.gpg_depots(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- 7. Đảm bảo có các status mới trong enum
DO $$
BEGIN
    -- Thêm PENDING_PAYMENT nếu chưa có
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignore if already exists
    END;
    
    -- Thêm PAID nếu chưa có
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PAID';
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignore if already exists
    END;
    
    -- Thêm các status khác
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PROCESSING_AT_DEPOT';
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'COMPLETED';
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignore if already exists
    END;
END $$;

-- 8. Thêm các cột timestamp mới nếu chưa có
ALTER TABLE public.cod_requests 
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS depot_processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 9. Migrate existing COD requests và tạo test data
DO $$
DECLARE
    test_org_id UUID;
    test_container_id UUID;
    test_approving_org_id UUID;
    test_gpg_depot_id UUID;
    first_gpg_depot_id UUID;
    existing_cod_request_id UUID;
BEGIN
    -- Lấy GPG depot đầu tiên để làm default
    SELECT id INTO first_gpg_depot_id 
    FROM gpg_depots 
    LIMIT 1;
    
    -- Cập nhật tất cả existing COD requests để point đến GPG depot đầu tiên
    -- (Trong thực tế, cần có logic mapping cụ thể hơn)
    UPDATE cod_requests 
    SET requested_depot_id = first_gpg_depot_id
    WHERE first_gpg_depot_id IS NOT NULL;
    
    RAISE NOTICE 'Updated % existing COD requests to use GPG depot: %', 
                 (SELECT COUNT(*) FROM cod_requests), first_gpg_depot_id;
    
    -- Lấy một existing COD request để test
    SELECT id INTO existing_cod_request_id
    FROM cod_requests 
    WHERE status = 'APPROVED' 
      AND cod_fee > 0
    LIMIT 1;
    
    -- Chuyển existing request thành PENDING_PAYMENT để test
    IF existing_cod_request_id IS NOT NULL THEN
        UPDATE cod_requests 
        SET 
            status = 'PENDING_PAYMENT',
            delivery_confirmed_at = NOW() - INTERVAL '1 hour'
        WHERE id = existing_cod_request_id;
        
        RAISE NOTICE 'Updated existing COD request % to PENDING_PAYMENT for testing', existing_cod_request_id;
    END IF;
    
    -- Lấy organization và container để tạo test data mới
    SELECT id INTO test_org_id 
    FROM organizations 
    WHERE type = 'TRUCKING_COMPANY' 
    LIMIT 1;
    
    SELECT id INTO test_approving_org_id 
    FROM organizations 
    WHERE type = 'SHIPPING_LINE' 
    LIMIT 1;
    
    SELECT id INTO test_container_id 
    FROM import_containers 
    WHERE status = 'AVAILABLE'
    LIMIT 1;

    -- Tạo thêm COD request mới để test nếu có đủ dữ liệu
    IF test_org_id IS NOT NULL AND test_container_id IS NOT NULL AND test_approving_org_id IS NOT NULL AND first_gpg_depot_id IS NOT NULL THEN
        
        -- COD request chờ thanh toán mới
        INSERT INTO cod_requests (
            dropoff_order_id,
            requesting_org_id,
            approving_org_id,
            original_depot_address,
            requested_depot_id,
            status,
            cod_fee,
            reason_for_request,
            delivery_confirmed_at,
            created_at
        ) VALUES (
            test_container_id,
            test_org_id,
            test_approving_org_id,
            'Depot Gốc - 123 Đường ABC, Quận 1, TP.HCM',
            first_gpg_depot_id,
            'PENDING_PAYMENT',
            750000,
            'Yêu cầu đổi nơi trả để thuận tiện vận chuyển - Test Data',
            NOW() - INTERVAL '30 minutes',
            NOW() - INTERVAL '2 hours'
        ) ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Created additional test COD request successfully';
    END IF;
    
    -- Summary
    RAISE NOTICE 'Migration completed. COD requests with PENDING_PAYMENT: %', 
                 (SELECT COUNT(*) FROM cod_requests WHERE status = 'PENDING_PAYMENT');
END $$;

-- 10. Tạo indexes nếu chưa có
CREATE INDEX IF NOT EXISTS idx_gpg_depots_name ON public.gpg_depots(name);
CREATE INDEX IF NOT EXISTS idx_cod_requests_status ON public.cod_requests(status);
CREATE INDEX IF NOT EXISTS idx_cod_requests_requested_depot ON public.cod_requests(requested_depot_id);

-- 11. Verify the relationship
SELECT 
    'cod_requests' as table_name,
    'requested_depot_id' as column_name,
    'gpg_depots' as referenced_table,
    'id' as referenced_column,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'cod_requests'
        AND kcu.column_name = 'requested_depot_id'
        AND ccu.table_name = 'gpg_depots'
    ) THEN 'EXISTS' ELSE 'MISSING' END as constraint_status;

-- 12. Show final test data
SELECT 
    'COD REQUESTS WITH PENDING_PAYMENT' as section,
    cr.id,
    cr.status,
    cr.cod_fee,
    cr.delivery_confirmed_at,
    cr.created_at,
    gd.name as depot_name,
    gd.address as depot_address
FROM cod_requests cr
LEFT JOIN gpg_depots gd ON cr.requested_depot_id = gd.id
WHERE cr.status = 'PENDING_PAYMENT'
ORDER BY cr.created_at DESC;

-- 13. Verify all cod_requests now point to gpg_depots
SELECT 
    'VERIFICATION' as section,
    COUNT(*) as total_cod_requests,
    COUNT(gd.id) as requests_with_valid_gpg_depot,
    CASE 
        WHEN COUNT(*) = COUNT(gd.id) THEN 'ALL MAPPED TO GPG DEPOTS ✅'
        ELSE 'SOME UNMAPPED ❌'
    END as mapping_status
FROM cod_requests cr
LEFT JOIN gpg_depots gd ON cr.requested_depot_id = gd.id; 