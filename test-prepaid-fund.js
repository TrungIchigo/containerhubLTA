// Test script để kiểm tra prepaid fund system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPrepaidFundSystem() {
  console.log('🔍 Testing Prepaid Fund System...');
  
  try {
    // 1. Kiểm tra bảng organization_prepaid_funds
    console.log('\n1. Checking organization_prepaid_funds table...');
    const { data: funds, error: fundsError } = await supabase
      .from('organization_prepaid_funds')
      .select('*')
      .limit(5);
    
    if (fundsError) {
      console.error('❌ Error accessing organization_prepaid_funds:', fundsError.message);
    } else {
      console.log('✅ organization_prepaid_funds table exists');
      console.log(`📊 Found ${funds.length} prepaid funds`);
      if (funds.length > 0) {
        console.log('Sample fund:', funds[0]);
      }
    }
    
    // 2. Kiểm tra bảng payment_qr_codes
    console.log('\n2. Checking payment_qr_codes table...');
    const { data: qrCodes, error: qrError } = await supabase
      .from('payment_qr_codes')
      .select('*')
      .limit(5);
    
    if (qrError) {
      console.error('❌ Error accessing payment_qr_codes:', qrError.message);
    } else {
      console.log('✅ payment_qr_codes table exists');
      console.log(`📊 Found ${qrCodes.length} QR codes`);
    }
    
    // 3. Kiểm tra stored procedure generate_vietqr_code
    console.log('\n3. Testing generate_vietqr_code function...');
    
    // Lấy một organization_id để test
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (orgError || !orgs || orgs.length === 0) {
      console.error('❌ No organizations found for testing');
      return;
    }
    
    const testOrgId = orgs[0].id;
    console.log(`Using organization ID: ${testOrgId}`);
    
    // Test với TOP_UP trước (không cần cod_request_id)
    const { data: qrResult, error: qrFuncError } = await supabase
      .rpc('generate_vietqr_code', {
        p_organization_id: testOrgId,
        p_amount: 100000,
        p_purpose: 'TOP_UP',
        p_cod_request_id: null
      });
    
    if (qrFuncError) {
      console.error('❌ Error calling generate_vietqr_code:', qrFuncError.message);
    } else {
      console.log('✅ generate_vietqr_code function works');
      console.log('QR Result:', qrResult);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPrepaidFundSystem();