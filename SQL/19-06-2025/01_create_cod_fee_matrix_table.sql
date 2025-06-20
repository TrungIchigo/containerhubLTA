-- Create COD Fee Matrix Table
-- This table stores the fee matrix for COD (Change of Destination) requests
-- between different depots based on distance and predefined rates

CREATE TABLE IF NOT EXISTS cod_fee_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_depot_id UUID NOT NULL,
    destination_depot_id UUID NOT NULL,
    fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    distance_km NUMERIC(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_origin_depot FOREIGN KEY (origin_depot_id) REFERENCES depots(id) ON DELETE CASCADE,
    CONSTRAINT fk_destination_depot FOREIGN KEY (destination_depot_id) REFERENCES depots(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT uk_depot_pair UNIQUE (origin_depot_id, destination_depot_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cod_fee_matrix_origin ON cod_fee_matrix(origin_depot_id);
CREATE INDEX IF NOT EXISTS idx_cod_fee_matrix_destination ON cod_fee_matrix(destination_depot_id);
CREATE INDEX IF NOT EXISTS idx_cod_fee_matrix_pair ON cod_fee_matrix(origin_depot_id, destination_depot_id);

-- Add comments
COMMENT ON TABLE cod_fee_matrix IS 'Fee matrix for COD (Change of Destination) requests between depots';
COMMENT ON COLUMN cod_fee_matrix.origin_depot_id IS 'Source depot ID';
COMMENT ON COLUMN cod_fee_matrix.destination_depot_id IS 'Destination depot ID';
COMMENT ON COLUMN cod_fee_matrix.fee IS 'COD fee in VND';
COMMENT ON COLUMN cod_fee_matrix.distance_km IS 'Distance between depots in kilometers';

-- Enable RLS (Row Level Security)
ALTER TABLE cod_fee_matrix ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read cod_fee_matrix" 
ON cod_fee_matrix FOR SELECT 
TO authenticated 
USING (true);

-- Create RLS policy to allow admin users to insert/update/delete
CREATE POLICY "Allow admin users to modify cod_fee_matrix" 
ON cod_fee_matrix FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
); 