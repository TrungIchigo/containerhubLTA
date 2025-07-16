-- Fix GPG COD fee matrix table constraints
-- Origin depot can be ANY depot, destination depot must be GPG depot

-- Drop existing foreign key constraints
ALTER TABLE public.gpg_cod_fee_matrix 
DROP CONSTRAINT IF EXISTS gpg_cod_fee_matrix_origin_depot_id_fkey;

ALTER TABLE public.gpg_cod_fee_matrix 
DROP CONSTRAINT IF EXISTS gpg_cod_fee_matrix_destination_depot_id_fkey;

-- Add correct foreign key constraints
-- Origin depot: references ANY depot (public.depots)
ALTER TABLE public.gpg_cod_fee_matrix 
ADD CONSTRAINT gpg_cod_fee_matrix_origin_depot_id_fkey 
FOREIGN KEY (origin_depot_id) REFERENCES public.depots(id) ON DELETE CASCADE;

-- Destination depot: references ONLY GPG depots (public.gpg_depots)  
ALTER TABLE public.gpg_cod_fee_matrix 
ADD CONSTRAINT gpg_cod_fee_matrix_destination_depot_id_fkey 
FOREIGN KEY (destination_depot_id) REFERENCES public.gpg_depots(id) ON DELETE CASCADE;

-- Verify constraints
DO $$
BEGIN
    RAISE NOTICE '=== GPG COD Fee Matrix Constraints Fixed ===';
    RAISE NOTICE 'Origin depot: References public.depots (ANY depot)';
    RAISE NOTICE 'Destination depot: References public.gpg_depots (GPG depots only)';
    RAISE NOTICE 'Ready for import: ALL depots -> GPG depots';
END $$; 