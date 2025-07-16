-- Xóa dữ liệu cũ trong bảng
TRUNCATE TABLE public.gpg_cod_fee_matrix;

-- Drop các constraint cũ
ALTER TABLE public.gpg_cod_fee_matrix 
    DROP CONSTRAINT IF EXISTS gpg_cod_fee_matrix_origin_depot_id_fkey,
    DROP CONSTRAINT IF EXISTS gpg_cod_fee_matrix_destination_depot_id_fkey;

-- Kiểm tra dữ liệu trong bảng depots và gpg_depots
SELECT 'Checking depots data' as check_type, COUNT(*) as count FROM public.depots;
SELECT 'Checking gpg_depots data' as check_type, COUNT(*) as count FROM public.gpg_depots;

-- Thêm lại constraint đúng
ALTER TABLE public.gpg_cod_fee_matrix
    ADD CONSTRAINT gpg_cod_fee_matrix_origin_depot_id_fkey 
    FOREIGN KEY (origin_depot_id) 
    REFERENCES public.depots(id) 
    ON DELETE CASCADE;

ALTER TABLE public.gpg_cod_fee_matrix
    ADD CONSTRAINT gpg_cod_fee_matrix_destination_depot_id_fkey 
    FOREIGN KEY (destination_depot_id) 
    REFERENCES public.gpg_depots(id) 
    ON DELETE CASCADE; 