-- =====================================================
-- EDEPOT INTEGRATION DATABASE MIGRATION
-- Script to add eDepot username column to profiles table
-- =====================================================

-- Task 2.1: Cập Nhật CSDL
-- Thêm cột để liên kết tài khoản i-ContainerHub với tài khoản eDepot

ALTER TABLE public.profiles
ADD COLUMN edepot_username TEXT UNIQUE;

COMMENT ON COLUMN public.profiles.edepot_username IS 'Lưu trữ username từ hệ thống eDepot để liên kết tài khoản.';

-- Tạo index để tối ưu hóa tìm kiếm theo edepot_username
CREATE INDEX IF NOT EXISTS idx_profiles_edepot_username 
ON public.profiles(edepot_username) 
WHERE edepot_username IS NOT NULL;

-- Kiểm tra kết quả
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'edepot_username';

-- Kiểm tra constraint unique
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%edepot_username%';