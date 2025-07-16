# Đường dẫn đến file SQL
$sqlFile = ".\15_fix_cod_requests_constraint.sql"

# Kiểm tra file tồn tại
if (-not (Test-Path $sqlFile)) {
    Write-Error "Không tìm thấy file SQL: $sqlFile"
    exit 1
}

# Đọc nội dung file SQL
$sqlContent = Get-Content $sqlFile -Raw

# Thực thi SQL bằng PSQL
$env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
psql -h $env:SUPABASE_DB_HOST -p $env:SUPABASE_DB_PORT -U $env:SUPABASE_DB_USER -d $env:SUPABASE_DB_NAME -f $sqlFile

# Kiểm tra kết quả
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Đã cập nhật constraint thành công!"
} else {
    Write-Error "❌ Lỗi khi cập nhật constraint. Exit code: $LASTEXITCODE"
    exit 1
} 