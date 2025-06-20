# =====================================================
# RUN COD STATUS UPDATE SCRIPT
# File: 04_run_cod_status_update.ps1
# Purpose: Chạy script cập nhật trạng thái COD
# Date: 19-06-2025
# =====================================================

Write-Host "=== COD STATUS UPDATE SCRIPT ===" -ForegroundColor Green
Write-Host "Starting COD status enum update..." -ForegroundColor Yellow

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#].*)=(.*)$") {
            Set-Variable -Name $matches[1] -Value $matches[2]
        }
    }
    Write-Host "Environment variables loaded from .env.local" -ForegroundColor Green
} else {
    Write-Host "Warning: .env.local not found. Make sure environment variables are set." -ForegroundColor Yellow
}

# Check if required environment variables exist
if (-not $NEXT_PUBLIC_SUPABASE_URL -or -not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Error: Missing required environment variables:" -ForegroundColor Red
    Write-Host "- NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Red
    Write-Host "- SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    exit 1
}

# Display connection info
Write-Host "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Cyan

try {
    # Read the SQL file
    $sqlFile = "04_update_cod_status_enum.sql"
    if (-not (Test-Path $sqlFile)) {
        throw "SQL file not found: $sqlFile"
    }
    
    $sqlContent = Get-Content $sqlFile -Raw
    Write-Host "SQL file loaded: $sqlFile" -ForegroundColor Green
    
    # Create headers for API request
    $headers = @{
        "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
        "apikey" = $SUPABASE_SERVICE_ROLE_KEY
    }
    
    # Prepare the request body
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json
    
    # Execute the SQL via Supabase REST API
    Write-Host "Executing SQL script..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
    
    Write-Host "SQL execution completed successfully!" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error executing SQL: $($_.Exception.Message)" -ForegroundColor Red
    
    # Alternative method using psql if available
    Write-Host "Attempting alternative method with psql..." -ForegroundColor Yellow
    
    # Extract connection info from Supabase URL
    if ($NEXT_PUBLIC_SUPABASE_URL -match "https://([^.]+)\.supabase\.co") {
        $projectId = $matches[1]
        $dbHost = "$projectId.db.supabase.co"
        $dbPort = "5432"
        $dbName = "postgres"
        $dbUser = "postgres"
        
        if ($DATABASE_PASSWORD) {
            # Create a temporary .pgpass file for authentication
            $pgpassFile = "$env:TEMP\.pgpass"
            "$dbHost`:$dbPort`:$dbName`:$dbUser`:$DATABASE_PASSWORD" | Out-File -FilePath $pgpassFile -Encoding ASCII
            $env:PGPASSFILE = $pgpassFile
            
            try {
                # Execute with psql
                $psqlCommand = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile"
                Write-Host "Executing: $psqlCommand" -ForegroundColor Cyan
                Invoke-Expression $psqlCommand
                
                Write-Host "SQL execution via psql completed!" -ForegroundColor Green
                
            } finally {
                # Clean up
                if (Test-Path $pgpassFile) {
                    Remove-Item $pgpassFile -Force
                }
                Remove-Item Env:PGPASSFILE -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host "DATABASE_PASSWORD not found. Cannot use psql method." -ForegroundColor Red
            Write-Host "Please run the SQL file manually in Supabase SQL Editor." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== COD STATUS UPDATE COMPLETED ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify the new statuses are available in database" -ForegroundColor White
Write-Host "2. Update frontend components to handle new statuses" -ForegroundColor White
Write-Host "3. Test the complete COD flow with new statuses" -ForegroundColor White
Write-Host "" 