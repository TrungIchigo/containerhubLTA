// Script kiểm tra organization_ids có prepaid funds
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrgFunds() {
  console.log('🔍 Checking organization_ids with prepaid funds...');
  
  try {
    const { data: funds, error } = await supabase
      .from('organization_prepaid_funds')
      .select('organization_id, fund_code, fund_name, balance')
      .limit(10);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('\nAvailable organization_ids with prepaid funds:');
    funds.forEach(f => {
      console.log(`- ${f.organization_id}`);
      console.log(`  Fund Code: ${f.fund_code}`);
      console.log(`  Fund Name: ${f.fund_name}`);
      console.log(`  Balance: ${f.balance.toLocaleString('vi-VN')} VNĐ`);
      console.log('');
    });
    
    // Kiểm tra organization_id từ debug page
    const debugOrgId = '1fd90dd8-6c46-439c-88be-a05ba78bac65';
    console.log(`\n🔍 Checking if debug org ID exists: ${debugOrgId}`);
    
    const matchingFund = funds.find(f => f.organization_id === debugOrgId);
    if (matchingFund) {
      console.log('✅ Debug org ID has prepaid fund!');
      console.log('Fund details:', matchingFund);
    } else {
      console.log('❌ Debug org ID does NOT have prepaid fund!');
      console.log('This explains why getPrepaidFund() returns "Không tìm thấy quỹ prepaid"');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkOrgFunds();