-- Create GPG depots table
CREATE TABLE IF NOT EXISTS public.gpg_depots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text,
  city_id uuid REFERENCES public.cities(id),
  latitude numeric(10,6),
  longitude numeric(10,6),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.gpg_depots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.gpg_depots
  FOR SELECT USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS gpg_depots_city_id_idx ON public.gpg_depots(city_id);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.gpg_depots
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at(); 