-- Tạm thời disable foreign key constraints
ALTER TABLE public.gpg_cod_fee_matrix 
  DROP CONSTRAINT gpg_cod_fee_matrix_origin_depot_id_fkey;

-- Thêm các depot còn thiếu vào bảng depots
INSERT INTO public.depots (id, name, address, created_at, updated_at)
VALUES 
  ('8a67c9a8-4639-4533-b32c-3528929df464', 'Missing Depot', 'Address TBD', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Enable lại foreign key constraint
ALTER TABLE public.gpg_cod_fee_matrix
  ADD CONSTRAINT gpg_cod_fee_matrix_origin_depot_id_fkey 
  FOREIGN KEY (origin_depot_id) 
  REFERENCES public.depots(id) 
  ON DELETE CASCADE; 