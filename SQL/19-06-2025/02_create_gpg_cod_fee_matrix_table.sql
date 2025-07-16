-- Create GPG COD fee matrix table
CREATE TABLE IF NOT EXISTS public.gpg_cod_fee_matrix (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_depot_id uuid REFERENCES public.gpg_depots(id),
  destination_depot_id uuid REFERENCES public.gpg_depots(id),
  distance_km numeric(10,2) NOT NULL CHECK (distance_km >= 0), -- Khoảng cách đường chim bay (tính từ lat/long)
  road_distance_km numeric(10,2) NOT NULL CHECK (road_distance_km >= 0), -- Khoảng cách đường bộ thực tế
  fee numeric(12,0) NOT NULL CHECK (fee >= 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(origin_depot_id, destination_depot_id)
);

-- Add RLS policies
ALTER TABLE public.gpg_cod_fee_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.gpg_cod_fee_matrix
  FOR SELECT USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS gpg_cod_fee_matrix_origin_depot_id_idx ON public.gpg_cod_fee_matrix(origin_depot_id);
CREATE INDEX IF NOT EXISTS gpg_cod_fee_matrix_destination_depot_id_idx ON public.gpg_cod_fee_matrix(destination_depot_id);
CREATE INDEX IF NOT EXISTS gpg_cod_fee_matrix_distance_idx ON public.gpg_cod_fee_matrix(distance_km);
CREATE INDEX IF NOT EXISTS gpg_cod_fee_matrix_road_distance_idx ON public.gpg_cod_fee_matrix(road_distance_km);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.gpg_cod_fee_matrix
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at(); 