-- Kiểm tra depot trong bảng depots
SELECT id, name, address 
FROM public.depots 
WHERE id = '8a67c9a8-4639-4533-b32c-3528929df464';

-- Kiểm tra tất cả các depot hiện có
SELECT id, name, address 
FROM public.depots 
ORDER BY name; 