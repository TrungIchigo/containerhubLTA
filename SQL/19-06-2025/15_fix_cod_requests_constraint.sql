-- Xóa constraint cũ
ALTER TABLE cod_requests
DROP CONSTRAINT IF EXISTS cod_requests_requested_depot_id_fkey;

-- Thêm constraint mới tham chiếu đến bảng gpg_depots
ALTER TABLE cod_requests
ADD CONSTRAINT cod_requests_requested_depot_id_fkey
FOREIGN KEY (requested_depot_id)
REFERENCES gpg_depots(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Thêm index để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_cod_requests_requested_depot_id
ON cod_requests(requested_depot_id);

-- Thêm comment để giải thích
COMMENT ON CONSTRAINT cod_requests_requested_depot_id_fkey ON cod_requests IS 
'COD requests chỉ được phép chọn depot từ bảng gpg_depots'; 