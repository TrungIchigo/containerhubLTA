-- Đồng bộ dữ liệu từ gpg_depots sang depots
INSERT INTO depots (id, name, address, city_id, created_at, updated_at)
SELECT 
    g.id,
    g.name,
    g.address,
    g.city_id,
    NOW(),
    NOW()
FROM gpg_depots g
LEFT JOIN depots d ON g.id = d.id
WHERE d.id IS NULL
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    city_id = EXCLUDED.city_id,
    updated_at = NOW();

-- Thêm comment để giải thích
COMMENT ON TABLE depots IS 
'Bảng này chứa tất cả các depot, bao gồm cả GPG depots. Dữ liệu được đồng bộ từ bảng gpg_depots.'; 