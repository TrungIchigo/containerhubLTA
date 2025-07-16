-- Kiểm tra ID trong bảng depots
SELECT 'In depots table' as location, id, name, address 
FROM public.depots 
WHERE id = '8a67c9a8-4639-4533-b32c-3528929df464';

-- Kiểm tra ID trong bảng gpg_depots
SELECT 'In gpg_depots table' as location, id, name, address 
FROM public.gpg_depots 
WHERE id = '8a67c9a8-4639-4533-b32c-3528929df464'; 