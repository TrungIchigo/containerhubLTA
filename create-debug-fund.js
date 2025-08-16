// Script tạo prepaid fund cho debug organization
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDebugFund() {
  console.log('🔧 Creating prepaid fund for debug organization...');
  
  const debugOrgId = '1fd90dd8-6c46-439c-88be-a05ba78bac65';
  
  try {
    // Kiểm tra xem organization có tồn tại không
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', debugOrgId)
      .single();
    
    if (orgError || !org) {
      console.error('❌ Organization not found:', debugOrgId);
      return;
    }
    
    console.log(`✅ Found organization: ${org.name}`);
    
    // Tạo prepaid fund
    const { data: fund, error: fundError } = await supabase
      .from('organization_prepaid_funds')
      .insert({
        organization_id: debugOrgId,
        balance: 1000000, // 1 triệu VNĐ để test
        currency: 'VND',
        fund_code: 'LP0000011',
        fund_name: `${org.name} - Quỹ i-Prepaid@LTA`,
        daily_topup_limit: 100000000,
        monthly_topup_limit: 1000000000,
        total_topped_up: 1000000,
        total_spent: 0
      })
      .select()
      .single();
    
    if (fundError) {
      console.error('❌ Error creating prepaid fund:', fundError.message);
      return;
    }
    
    console.log('✅ Prepaid fund created successfully!');
    console.log('Fund details:', {
      id: fund.id,
      fund_code: fund.fund_code,
      fund_name: fund.fund_name,
      balance: fund.balance.toLocaleString('vi-VN') + ' VNĐ'
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createDebugFund();