// Test script để kiểm tra user và prepaid fund access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserFundAccess() {
  console.log('🔍 Testing User Fund Access...');
  
  try {
    // 1. Kiểm tra users và profiles
    console.log('\n1. Checking users and profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, organization_id, role')
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message);
      return;
    }
    
    console.log(`✅ Found ${profiles.length} user profiles`);
    profiles.forEach((profile, index) => {
      console.log(`User ${index + 1}:`, {
        id: profile.id,
        email: profile.email,
        organization_id: profile.organization_id,
        role: profile.role
      });
    });
    
    // 2. Kiểm tra organizations
    console.log('\n2. Checking organizations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, tax_code')
      .limit(10);
    
    if (orgsError) {
      console.error('❌ Error accessing organizations:', orgsError.message);
      return;
    }
    
    console.log(`✅ Found ${orgs.length} organizations`);
    orgs.forEach((org, index) => {
      console.log(`Org ${index + 1}:`, {
        id: org.id,
        name: org.name,
        tax_code: org.tax_code
      });
    });
    
    // 3. Kiểm tra prepaid funds cho từng organization
    console.log('\n3. Checking prepaid funds for each organization...');
    for (const org of orgs) {
      const { data: funds, error: fundsError } = await supabase
        .from('organization_prepaid_funds')
        .select('*')
        .eq('organization_id', org.id);
      
      if (fundsError) {
        console.error(`❌ Error accessing funds for org ${org.name}:`, fundsError.message);
      } else {
        console.log(`💰 Org "${org.name}" has ${funds.length} prepaid funds:`);
        funds.forEach(fund => {
          console.log(`  - Fund: ${fund.fund_code} | Balance: ${fund.balance.toLocaleString('vi-VN')} VNĐ`);
        });
      }
    }
    
    // 4. Test getPrepaidFund logic cho user đầu tiên có organization_id
    console.log('\n4. Testing getPrepaidFund logic...');
    const userWithOrg = profiles.find(p => p.organization_id);
    
    if (!userWithOrg) {
      console.error('❌ No user found with organization_id');
      return;
    }
    
    console.log(`Testing with user: ${userWithOrg.email} (org: ${userWithOrg.organization_id})`);
    
    const { data: fund, error: fundError } = await supabase
      .from('organization_prepaid_funds')
      .select('*')
      .eq('organization_id', userWithOrg.organization_id)
      .single();
    
    if (fundError) {
      console.error('❌ Error in getPrepaidFund simulation:', fundError.message);
      console.log('This is likely the cause of "Không tìm thấy quỹ prepaid" error!');
    } else {
      console.log('✅ getPrepaidFund simulation successful:');
      console.log('Fund data:', {
        fund_code: fund.fund_code,
        balance: fund.balance.toLocaleString('vi-VN') + ' VNĐ',
        fund_name: fund.fund_name
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUserFundAccess();