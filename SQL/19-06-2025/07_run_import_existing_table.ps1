# COD Fee Matrix Import Script for Existing Table
# Tác giả: Assistant
# Ngày: 19/06/2025
# Mô tả: Import dữ liệu từ CSV vào table cod_fee_matrix đã tồn tại

Write-Host "🚀 COD Fee Matrix Import Script - Import to Existing Table" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Kiểm tra file CSV
$csvFile = "cod_fee_matrix_full.csv"
if (-not (Test-Path $csvFile)) {
    Write-Host "❌ Error: File $csvFile not found!" -ForegroundColor Red
    Write-Host "Please make sure you are in the correct directory containing the CSV file." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Found CSV file: $csvFile" -ForegroundColor Green

# Kiểm tra file script
$scriptFile = "06_import_cod_fee_to_existing_table.js"
if (-not (Test-Path $scriptFile)) {
    Write-Host "❌ Error: Script file $scriptFile not found!" -ForegroundColor Red
    Write-Host "Please make sure you are in the correct directory." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Found import script: $scriptFile" -ForegroundColor Green

# Kiểm tra Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Kiểm tra environment variables
Write-Host ""
Write-Host "🔧 Checking Supabase configuration..." -ForegroundColor Yellow

if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Host "❌ Missing environment variable: NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Red
    Write-Host "Please set your Supabase URL:" -ForegroundColor Yellow
    Write-Host '   $env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or add it to your .env file in the project root." -ForegroundColor Yellow
    pause
    exit 1
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Missing environment variable: SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    Write-Host "Please set your Supabase service role key:" -ForegroundColor Yellow
    Write-Host '   $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or add it to your .env file in the project root." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Supabase URL configured" -ForegroundColor Green
Write-Host "✅ Service role key configured" -ForegroundColor Green

# Kiểm tra dependencies
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "package.json")) {
    Write-Host "⚠️ Warning: No package.json found in current directory" -ForegroundColor Yellow
    Write-Host "Make sure you run this from your project root directory" -ForegroundColor Yellow
}

# Cài đặt dependencies nếu cần
if (Test-Path "package.json") {
    Write-Host "Installing/checking dependencies..." -ForegroundColor Yellow
    try {
        npm install @supabase/supabase-js --silent
        Write-Host "✅ Dependencies ready" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Warning: Could not install dependencies. Continuing anyway..." -ForegroundColor Yellow
    }
}

# Hiển thị thông tin import
Write-Host ""
Write-Host "📊 Import Information:" -ForegroundColor Cyan
Write-Host "   • Source CSV: $csvFile" -ForegroundColor White
Write-Host "   • Target table: cod_fee_matrix (existing)" -ForegroundColor White
Write-Host "   • Expected records: ~784 entries (28x28 depot matrix)" -ForegroundColor White
Write-Host "   • Will clear existing data and insert new data" -ForegroundColor Yellow

# Xác nhận từ người dùng
Write-Host ""
Write-Host "⚠️ WARNING: This will DELETE all existing data in cod_fee_matrix table!" -ForegroundColor Red
$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -notmatch '^[Yy]$') {
    Write-Host "❌ Import cancelled by user" -ForegroundColor Yellow
    pause
    exit 0
}

# Chạy import script
Write-Host ""
Write-Host "🚀 Starting import process..." -ForegroundColor Cyan
Write-Host "This may take a few minutes depending on your internet connection..." -ForegroundColor Yellow

try {
    # Chạy Node.js script
    $startTime = Get-Date
    node $scriptFile
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Import completed successfully!" -ForegroundColor Green
        Write-Host "⏱️ Total time: $($duration.ToString('mm:ss'))" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Check your Supabase dashboard to verify the data" -ForegroundColor White
        Write-Host "   2. Test COD fee calculation in your application" -ForegroundColor White
        Write-Host "   3. The COD request dialog should now show real fees" -ForegroundColor White
        
        Write-Host ""
        Write-Host "✨ Your COD fee matrix is now ready!" -ForegroundColor Green
    } else {
        throw "Node.js script exited with error code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "💥 Import failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Check your internet connection" -ForegroundColor White
    Write-Host "   2. Verify your Supabase credentials" -ForegroundColor White
    Write-Host "   3. Make sure the cod_fee_matrix table exists" -ForegroundColor White
    Write-Host "   4. Check if you have the required permissions" -ForegroundColor White
    pause
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
pause 