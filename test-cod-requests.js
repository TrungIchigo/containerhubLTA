// Test script để kiểm tra cod_requests table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCodRequests() {
  console.log('🔍 Testing COD Requests...');
  
  try {
    // 1. Kiểm tra bảng cod_requests
    console.log('\n1. Checking cod_requests table...');
    const { data: codRequests, error: codError } = await supabase
      .from('cod_requests')
      .select('*')
      .limit(10);
    
    if (codError) {
      console.error('❌ Error accessing cod_requests:', codError.message);
    } else {
      console.log(`✅ Found ${codRequests.length} COD requests`);
      codRequests.forEach((request, index) => {
        console.log(`COD Request ${index + 1}:`, {
          id: request.id,
          container_number: request.container_number,
          cod_fee: request.cod_fee,
          status: request.status,
          created_at: request.created_at
        });
      });
    }
    
    // 2. Test tạo QR với COD request thực tế
    if (codRequests && codRequests.length > 0) {
      console.log('\n2. Testing QR generation with real COD request...');
      const testRequest = codRequests[0];
      
      // Lấy organization_id từ COD request thông qua import_containers
      console.log(`Using COD request: ${testRequest.id}`);
      console.log(`Dropoff order ID: ${testRequest.dropoff_order_id}`);
      
      if (!testRequest.dropoff_order_id) {
        console.log('⚠️ COD request has no dropoff_order_id, using requesting_org_id instead');
        const orgId = testRequest.requesting_org_id;
        console.log(`Organization ID: ${orgId}`);
        
        const { data: qrResult, error: qrError } = await supabase
          .rpc('generate_vietqr_code', {
            p_organization_id: orgId,
            p_amount: testRequest.cod_fee || 100000,
            p_purpose: 'COD_PAYMENT',
            p_cod_request_id: testRequest.id
          });
        
        if (qrError) {
          console.error('❌ Error generating QR with real COD request:', qrError.message);
        } else {
          console.log('✅ QR generation with real COD request successful:');
          console.log('QR Result:', qrResult[0]);
        }
        return;
      }
      
      const { data: containers, error: containerError } = await supabase
        .from('import_containers')
        .select('trucking_company_org_id')
        .eq('id', testRequest.dropoff_order_id)
        .single();
      
      if (containerError) {
        console.error('❌ Error getting container info:', containerError.message);
        console.log('⚠️ Trying with requesting_org_id instead...');
        const orgId = testRequest.requesting_org_id;
        console.log(`Organization ID: ${orgId}`);
        
        const { data: qrResult, error: qrError } = await supabase
          .rpc('generate_vietqr_code', {
            p_organization_id: orgId,
            p_amount: testRequest.cod_fee || 100000,
            p_purpose: 'COD_PAYMENT',
            p_cod_request_id: testRequest.id
          });
        
        if (qrError) {
          console.error('❌ Error generating QR with real COD request:', qrError.message);
        } else {
          console.log('✅ QR generation with real COD request successful:');
          console.log('QR Result:', qrResult[0]);
        }
        return;
      }
      
      console.log(`Organization ID: ${containers.trucking_company_org_id}`);
      
      const { data: qrResult, error: qrError } = await supabase
        .rpc('generate_vietqr_code', {
          p_organization_id: containers.trucking_company_org_id,
          p_amount: testRequest.cod_fee || 100000,
          p_purpose: 'COD_PAYMENT',
          p_cod_request_id: testRequest.id
        });
      
      if (qrError) {
        console.error('❌ Error generating QR with real COD request:', qrError.message);
      } else {
        console.log('✅ QR generation with real COD request successful:');
        console.log('QR Result:', qrResult[0]);
      }
    }
    
    // 3. Kiểm tra foreign key constraint
    console.log('\n3. Testing foreign key constraint...');
    const fakeUUID = '00000000-0000-0000-0000-000000000000';
    
    const { data: qrResult2, error: qrError2 } = await supabase
      .rpc('generate_vietqr_code', {
        p_organization_id: 'ad2171cf-1c9a-4153-ad5e-ec2b4d41d794', // existing org
        p_amount: 100000,
        p_purpose: 'COD_PAYMENT',
        p_cod_request_id: fakeUUID
      });
    
    if (qrError2) {
      console.error('❌ Expected error with fake COD request ID:', qrError2.message);
      console.log('This confirms the foreign key constraint is working.');
    } else {
      console.log('⚠️ Unexpected: QR generation with fake COD request succeeded');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCodRequests();