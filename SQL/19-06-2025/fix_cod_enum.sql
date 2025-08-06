-- =====================================================
-- FIX COD REQUEST STATUS ENUM
-- File: fix_cod_enum.sql
-- Purpose: Sửa lỗi enum cod_request_status thiếu các giá trị
-- Date: 19-06-2025
-- =====================================================

-- Thêm các trạng thái mới vào enum cod_request_status nếu chưa có
DO $$
BEGIN
    -- Thêm PENDING_PAYMENT nếu chưa có
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
        RAISE NOTICE 'Added PENDING_PAYMENT to cod_request_status enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'PENDING_PAYMENT already exists in cod_request_status enum';
    END;
    
    -- Thêm PAID nếu chưa có
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PAID';
        RAISE NOTICE 'Added PAID to cod_request_status enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'PAID already exists in cod_request_status enum';
    END;
    
    -- Thêm PROCESSING_AT_DEPOT nếu chưa có
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'PROCESSING_AT_DEPOT';
        RAISE NOTICE 'Added PROCESSING_AT_DEPOT to cod_request_status enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'PROCESSING_AT_DEPOT already exists in cod_request_status enum';
    END;
    
    -- Thêm COMPLETED nếu chưa có
    BEGIN
        ALTER TYPE public.cod_request_status ADD VALUE IF NOT EXISTS 'COMPLETED';
        RAISE NOTICE 'Added COMPLETED to cod_request_status enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'COMPLETED already exists in cod_request_status enum';
    END;
END $$;

-- Thêm các action tương ứng vào audit log enum nếu chưa có
DO $$
BEGIN
    -- Thêm DELIVERY_CONFIRMED nếu chưa có
    BEGIN
        ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'DELIVERY_CONFIRMED';
        RAISE NOTICE 'Added DELIVERY_CONFIRMED to audit_log_action enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'DELIVERY_CONFIRMED already exists in audit_log_action enum';
    END;
    
    -- Thêm PAYMENT_CONFIRMED nếu chưa có
    BEGIN
        ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'PAYMENT_CONFIRMED';
        RAISE NOTICE 'Added PAYMENT_CONFIRMED to audit_log_action enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'PAYMENT_CONFIRMED already exists in audit_log_action enum';
    END;
    
    -- Thêm DEPOT_PROCESSING_STARTED nếu chưa có
    BEGIN
        ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'DEPOT_PROCESSING_STARTED';
        RAISE NOTICE 'Added DEPOT_PROCESSING_STARTED to audit_log_action enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'DEPOT_PROCESSING_STARTED already exists in audit_log_action enum';
    END;
    
    -- Thêm COMPLETED nếu chưa có
    BEGIN
        ALTER TYPE public.audit_log_action ADD VALUE IF NOT EXISTS 'COMPLETED';
        RAISE NOTICE 'Added COMPLETED to audit_log_action enum';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'COMPLETED already exists in audit_log_action enum';
    END;
END $$;

-- Thêm các cột timestamp mới vào bảng cod_requests nếu chưa có
ALTER TABLE public.cod_requests 
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS depot_processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Kiểm tra kết quả
DO $$
DECLARE
    enum_values TEXT[];
    audit_values TEXT[];
BEGIN
    -- Lấy tất cả giá trị của enum cod_request_status
    SELECT array_agg(enumlabel ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'cod_request_status');
    
    -- Lấy tất cả giá trị của enum audit_log_action
    SELECT array_agg(enumlabel ORDER BY enumsortorder) INTO audit_values
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_log_action');
    
    RAISE NOTICE '=== COD ENUM UPDATE COMPLETED ===';
    RAISE NOTICE 'cod_request_status values: %', array_to_string(enum_values, ', ');
    RAISE NOTICE 'audit_log_action values: %', array_to_string(audit_values, ', ');
END $$; 