-- Kiểm tra dữ liệu trong bảng gpg_cod_fee_matrix
SELECT origin_depot_id, destination_depot_id, fee
FROM public.gpg_cod_fee_matrix;

-- Kiểm tra các bản ghi lỗi
SELECT origin_depot_id, destination_depot_id, fee
FROM public.gpg_cod_fee_matrix
WHERE origin_depot_id NOT IN (SELECT id FROM public.depots); 