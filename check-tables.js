require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Use raw SQL query to get tables
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    });
    
    if (error) {
      console.error('❌ Error getting tables:', error);
      console.log('🔄 Trying direct table access...');
    } else {
      console.log('✅ Tables found:', data?.map(row => row.table_name));
    }
    
    // Check specifically for containers and import_containers
    console.log('\n🔍 Checking for container-related tables...');
    
    const containerTables = ['containers', 'import_containers', 'export_bookings'];
    
    for (const tableName of containerTables) {
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
        
      if (tableError) {
        console.log(`❌ Table '${tableName}' does not exist or is not accessible:`, tableError.message);
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`);
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkTables();