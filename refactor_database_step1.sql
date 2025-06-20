-- Refactor Step 1: Cập nhật CSDL và Định nghĩa Cốt lõi
-- Thêm vai trò PLATFORM_ADMIN vào ENUM user_role nếu chưa có
DO $$
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'user_role' AND e.enumlabel = 'PLATFORM_ADMIN'
    ) THEN 
        ALTER TYPE public.user_role ADD VALUE 'PLATFORM_ADMIN'; 
    END IF;
END$$;

-- Cho phép cột organization_id trong bảng profiles có thể là NULL
-- Điều này cần thiết cho tài khoản PLATFORM_ADMIN không thuộc tổ chức nào
ALTER TABLE public.profiles
ALTER COLUMN organization_id DROP NOT NULL; 