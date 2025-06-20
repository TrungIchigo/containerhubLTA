# COD Fee Matrix Setup Script for Windows PowerShell
# This script sets up the COD fee matrix table and imports data

Write-Host "🚀 Setting up COD Fee Matrix..." -ForegroundColor Green

# Step 1: Create the table
Write-Host "📋 Step 1: Creating cod_fee_matrix table..." -ForegroundColor Yellow

# Check if psql is available
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "Using psql to create table..." -ForegroundColor Blue
    psql -f "01_create_cod_fee_matrix_table.sql"
} else {
    Write-Host "⚠️ psql not found. Please run the SQL file manually in your database:" -ForegroundColor Red
    Write-Host "   01_create_cod_fee_matrix_table.sql" -ForegroundColor Yellow
}

# Step 2: Generate full COD fee matrix
Write-Host "📊 Step 2: Generating full COD fee matrix..." -ForegroundColor Yellow

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "🔄 Generating COD fee matrix from depot coordinates..." -ForegroundColor Blue
    node "04_generate_full_cod_fee_matrix.js"
} else {
    Write-Host "⚠️ Node.js not found. Please install Node.js and run:" -ForegroundColor Red
    Write-Host "   node 04_generate_full_cod_fee_matrix.js" -ForegroundColor Yellow
}

# Step 3: Import data using Node.js script
Write-Host "📊 Step 3: Importing COD fee matrix data..." -ForegroundColor Yellow

# Check if Node.js is available
if (Get-Command node -ErrorAction SilentlyContinue) {
    # Check if required packages are installed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing required packages..." -ForegroundColor Blue
        npm install @supabase/supabase-js
    }
    
    Write-Host "🔄 Running import script..." -ForegroundColor Blue
    node "02_import_cod_fee_matrix_data.js"
} else {
    Write-Host "⚠️ Node.js not found. Please install Node.js and run:" -ForegroundColor Red
    Write-Host "   npm install @supabase/supabase-js" -ForegroundColor Yellow
    Write-Host "   node 02_import_cod_fee_matrix_data.js" -ForegroundColor Yellow
}

Write-Host "✅ COD Fee Matrix setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify data in your database: SELECT COUNT(*) FROM cod_fee_matrix;" -ForegroundColor White
Write-Host "2. Test the COD fee calculation in your application" -ForegroundColor White
Write-Host "3. The COD request dialog should now show fees automatically" -ForegroundColor White 