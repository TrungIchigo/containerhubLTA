-- Kiểm tra các giá trị enum có sẵn
SELECT enumlabel as available_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_log_action')
ORDER BY enumlabel; 