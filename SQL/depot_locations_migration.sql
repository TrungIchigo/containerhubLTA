-- #############################################################
-- # MIGRATION: DEPOT LOCATIONS - CITIES AND DEPOTS SYSTEM  #
-- # Tạo hệ thống quản lý thành phố và depot theo cấu trúc mới #
-- #############################################################

-- BƯỚC 1: TẠO BẢNG CITIES (TỈNH/THÀNH PHỐ)
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_major_city BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BƯỚC 2: TẠO BẢNG DEPOTS
CREATE TABLE IF NOT EXISTS public.depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BƯỚC 3: TẠO INDEXES ĐỂ TĂNG TỐC TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_depots_city_id ON public.depots(city_id);
CREATE INDEX IF NOT EXISTS idx_cities_is_major_city ON public.cities(is_major_city);
CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);

-- BƯỚC 4: THÊM 6 THÀNH PHỐ TRỰC THUỘC TRUNG ƯƠNG (is_major_city = TRUE)
INSERT INTO public.cities (name, is_major_city) VALUES
('Thành phố Hà Nội', TRUE),
('Thành phố Huế', TRUE),
('Thành phố Hải Phòng', TRUE),
('Thành phố Đà Nẵng', TRUE),
('Thành phố Hồ Chí Minh', TRUE),
('Thành phố Cần Thơ', TRUE)
ON CONFLICT (name) DO NOTHING;

-- BƯỚC 5: THÊM 28 TỈNH (is_major_city = FALSE)
-- Nhóm 1: 11 tỉnh không sáp nhập
INSERT INTO public.cities (name, is_major_city) VALUES
('Cao Bằng', FALSE),
('Điện Biên', FALSE),
('Hà Tĩnh', FALSE),
('Lai Châu', FALSE),
('Lạng Sơn', FALSE),
('Nghệ An', FALSE),
('Quảng Ninh', FALSE),
('Sơn La', FALSE),
('Thanh Hóa', FALSE),
('Tuyên Quang', FALSE),
('Lào Cai', FALSE),
('Thái Nguyên', FALSE),
('Phú Thọ', FALSE),
('Bắc Ninh', FALSE),
('Hưng Yên', FALSE),
('Ninh Bình', FALSE),
('Quảng Trị', FALSE),
('Quảng Ngãi', FALSE),
('Gia Lai', FALSE),
('Khánh Hòa', FALSE),
('Lâm Đồng', FALSE),
('Đắk Lắk', FALSE),
('Đồng Nai', FALSE),
('Tây Ninh', FALSE),
('Vĩnh Long', FALSE),
('Đồng Tháp', FALSE),
('An Giang', FALSE),
('Kiên Giang', FALSE)
ON CONFLICT (name) DO NOTHING;

-- BƯỚC 6: THÊM DỮ LIỆU DEPOT/ICD VỚI TỌA ĐỘ GPS
-- Sử dụng CTE để lấy ID các thành phố
WITH city_ids AS (
    SELECT id, name FROM public.cities
)
INSERT INTO public.depots (name, address, city_id, latitude, longitude)
VALUES
-- **** KHU VỰC PHÍA NAM (MAPPING VÀO "THÀNH PHỐ HỒ CHÍ MINH" MỚI) ****
('ICD Tân Cảng Sóng Thần', 'Số 7/20, đường ĐT 743, KCN Sóng Thần 1, Dĩ An, Bình Dương', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.8953, 106.7561),
('ICD Phước Long 3 (PLI)', 'Số 1, đường 12, P. Phước Long A, TP. Thủ Đức, TP. HCM', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.8247, 106.7725),
('ICD Tanamexco', 'Số 12, Quốc lộ 1, P. Linh Trung, TP. Thủ Đức, TP. HCM', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.8712, 106.7701),
('ICD Transimex', 'Số 172, Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức, TP. HCM', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.8524, 106.7645),
('Cảng Cát Lái', '1295B Nguyễn Thị Định, P. Cát Lái, TP. Thủ Đức, TP. HCM', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.7571, 106.7845),
('Solog Depot', 'KCN Sóng Thần 2, Dĩ An, Bình Dương', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.9015, 106.7412),
('Bình Dương Port', 'Khu phố Bình đáng, P. Bình Hòa, TP. Thuận An, Bình Dương', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.9028, 106.7119),
('ICD Phú Mỹ 1', 'Đường số 1B, KCN Phú Mỹ 1, Thị xã Phú Mỹ, BR-VT', (SELECT id FROM city_ids WHERE name = 'Thành phố Hồ Chí Minh'), 10.5638, 107.0315),

-- Tây Ninh (tỉnh riêng)
('ICD Thanh Phước', 'Ấp 1, Xã Thanh Phước, Huyện Gò Dầu, Tây Ninh', (SELECT id FROM city_ids WHERE name = 'Tây Ninh'), 11.1396, 106.3157),

-- Đồng Nai (tỉnh riêng)
('ICD Tân Cảng Nhơn Trạch', 'Đường số 2, KCN Nhơn Trạch, Đồng Nai', (SELECT id FROM city_ids WHERE name = 'Đồng Nai'), 10.6698, 106.8732),
('ICD Tân Cảng Long Bình', 'Số 10, Bùi Văn Hòa, P. Long Bình, TP. Biên Hòa, Đồng Nai', (SELECT id FROM city_ids WHERE name = 'Đồng Nai'), 10.9415, 106.9048),
('ECS Depot Biên Hòa', 'Số 1, đường số 9A, KCN Biên Hòa 2, TP. Biên Hòa, Đồng Nai', (SELECT id FROM city_ids WHERE name = 'Đồng Nai'), 10.9327, 106.8642),

-- **** KHU VỰC PHÍA BẮC ****
-- Hải Phòng (thành phố trực thuộc trung ương)
('ICD Tân Cảng Hải Phòng', 'Km 105, Đường 5 mới, P. Sở Dầu, Q. Hồng Bàng, Hải Phòng', (SELECT id FROM city_ids WHERE name = 'Thành phố Hải Phòng'), 20.8653, 106.6502),
('ICD Đình Vũ – Quảng Bình', 'Khu kinh tế Đình Vũ, P. Đông Hải 2, Q. Hải An, Hải Phòng', (SELECT id FROM city_ids WHERE name = 'Thành phố Hải Phòng'), 20.8541, 106.7825),
('ICD Nam Đình Vũ', 'Khu phi thuế quan và KCN Nam Đình Vũ, Q. Hải An, Hải Phòng', (SELECT id FROM city_ids WHERE name = 'Thành phố Hải Phòng'), 20.8315, 106.8043),
('ICD Hoàng Thành', 'Km 9, đường 356, P. Đông Hải 2, Q. Hải An, Hải Phòng', (SELECT id FROM city_ids WHERE name = 'Thành phố Hải Phòng'), 20.8491, 106.7588),
('VIP Green Port', 'Khu kinh tế Đình Vũ, Q. Hải An, Hải Phòng', (SELECT id FROM city_ids WHERE name = 'Thành phố Hải Phòng'), 20.8459, 106.7629),

-- Hà Nội (thành phố trực thuộc trung ương)
('ICD Long Biên', 'Số 1, đường Huỳnh Tấn Phát, KCN Sài Đồng B, Long Biên, Hà Nội', (SELECT id FROM city_ids WHERE name = 'Thành phố Hà Nội'), 21.0375, 105.9238),
('ICD Gia Lâm (Mitraco)', 'Cổ Bi, Huyện Gia Lâm, Hà Nội', (SELECT id FROM city_ids WHERE name = 'Thành phố Hà Nội'), 21.0351, 105.9387),

-- Các tỉnh phía Bắc khác
('ICD Km3+4 Móng Cái', 'QL18, Phường Hải Yên, TP Móng Cái, Quảng Ninh', (SELECT id FROM city_ids WHERE name = 'Quảng Ninh'), 21.4883, 107.9404),
('ICD Tân Cảng Quế Võ', 'KCN Quế Võ, Xã Phương Liễu, Huyện Quế Võ, Bắc Ninh', (SELECT id FROM city_ids WHERE name = 'Bắc Ninh'), 21.1278, 106.0964),
('ICD Hải Linh', 'Khu 9, Xã Phượng Lâu, TP Việt Trì, Phú Thọ', (SELECT id FROM city_ids WHERE name = 'Phú Thọ'), 21.3541, 105.4192),

-- **** KHU VỰC MIỀN TRUNG & TÂY NGUYÊN ****
-- Đà Nẵng (thành phố trực thuộc trung ương)
('Gemadept (Genuine Partner) Đà Nẵng', 'Đường Yết Kiêu, P. Thọ Quang, Q. Sơn Trà, TP Đà Nẵng', (SELECT id FROM city_ids WHERE name = 'Thành phố Đà Nẵng'), 16.1205, 108.2321),
('Viconship Đà Nẵng', 'Số 2, đường 3 tháng 2, Q. Hải Châu, TP Đà Nẵng', (SELECT id FROM city_ids WHERE name = 'Thành phố Đà Nẵng'), 16.0792, 108.2241),

-- Ninh Bình (tỉnh)
('ICD Phúc Lộc – Ninh Bình', 'Cụm công nghiệp Cầu Yên, Xã Ninh An, Huyện Hoa Lư, Ninh Bình', (SELECT id FROM city_ids WHERE name = 'Ninh Bình'), 20.2198, 105.9537),
('ICD Tân Cảng Hà Nam', 'Phường Thanh Tuyền, TP Phủ Lý, Hà Nam', (SELECT id FROM city_ids WHERE name = 'Ninh Bình'), 20.5015, 105.9283),

-- **** KHU VỰC TÂY NAM BỘ (MAPPING VÀO "THÀNH PHỐ CẦN THƠ" MỚI) ****
('Cảng Cái Cui Cần Thơ', 'Đường Mậu Thân, P. An Hòa, Q. Ninh Kiều, Cần Thơ', (SELECT id FROM city_ids WHERE name = 'Thành phố Cần Thơ'), 10.0291, 105.7839),
('Cảng Lee & Man', 'KCN Sông Hậu, Xã Mái Dầm, Huyện Châu Thành, Hậu Giang', (SELECT id FROM city_ids WHERE name = 'Thành phố Cần Thơ'), 9.9418, 105.8016)
ON CONFLICT DO NOTHING;

-- BƯỚC 7: TẠO RLS POLICIES
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;

-- Policy cho cities - cho phép đọc public
CREATE POLICY "Cities are viewable by everyone" ON public.cities
    FOR SELECT USING (true);

-- Policy cho depots - cho phép đọc public
CREATE POLICY "Depots are viewable by everyone" ON public.depots
    FOR SELECT USING (true);

-- Policy cho cities - chỉ service_role có thể modify
CREATE POLICY "Only service_role can modify cities" ON public.cities
    FOR ALL USING (auth.role() = 'service_role');

-- Policy cho depots - chỉ service_role có thể modify
CREATE POLICY "Only service_role can modify depots" ON public.depots
    FOR ALL USING (auth.role() = 'service_role');

-- BƯỚC 8: THÔNG BÁO HOÀN TẤT
SELECT 'Cập nhật danh sách 34 Tỉnh/Thành phố và Depot/ICD thành công!' as status; 