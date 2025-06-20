#!/bin/bash

# COD Fee Matrix Setup Script
# This script sets up the COD fee matrix table and imports data

echo "🚀 Setting up COD Fee Matrix..."

# Step 1: Create the table
echo "📋 Step 1: Creating cod_fee_matrix table..."
if command -v psql &> /dev/null; then
    # If psql is available, run SQL directly
    echo "Using psql to create table..."
    psql -f 01_create_cod_fee_matrix_table.sql
else
    echo "⚠️ psql not found. Please run the SQL file manually in your database:"
    echo "   01_create_cod_fee_matrix_table.sql"
fi

# Step 2: Import data using Node.js script
echo "📊 Step 2: Importing COD fee matrix data..."
if command -v node &> /dev/null; then
    # Check if required packages are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing required packages..."
        npm install @supabase/supabase-js
    fi
    
    echo "🔄 Running import script..."
    node 02_import_cod_fee_matrix_data.js
else
    echo "⚠️ Node.js not found. Please install Node.js and run:"
    echo "   npm install @supabase/supabase-js"
    echo "   node 02_import_cod_fee_matrix_data.js"
fi

echo "✅ COD Fee Matrix setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Verify data in your database: SELECT COUNT(*) FROM cod_fee_matrix;"
echo "2. Test the COD fee calculation in your application"
echo "3. The COD request dialog should now show fees automatically" 