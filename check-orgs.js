// Script kiểm tra organizations có sẵn
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrganizations() {
  console.log('🔍 Checking available organizations...');
  
  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(10);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('\nAvailable organizations:');
    orgs.forEach(o => {
      console.log(`- ${o.id}`);
      console.log(`  Name: ${o.name}`);
      console.log('');
    });
    
    // Kiểm tra organization_id từ debug page
    const debugOrgId = '1fd90dd8-6c46-439c-88be-a05ba78bac65';
    console.log(`🔍 Checking if debug org ID exists: ${debugOrgId}`);
    
    const matchingOrg = orgs.find(o => o.id === debugOrgId);
    if (matchingOrg) {
      console.log('✅ Debug org ID exists!');
    } else {
      console.log('❌ Debug org ID does NOT exist!');
      console.log('\n💡 Solution: Use one of the existing organization IDs above');
      console.log('   or create the missing organization in the database.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkOrganizations();