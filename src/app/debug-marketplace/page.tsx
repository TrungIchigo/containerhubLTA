import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'

export default async function DebugMarketplacePage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  // Get all import containers with marketplace flag
  const { data: allContainers, error: containersError } = await supabase
    .from('import_containers')
    .select(`
      id,
      container_number,
      container_type,
      drop_off_location,
      available_from_datetime,
      status,
      is_listed_on_marketplace,
      trucking_company_org_id,
      shipping_line_org_id,
      trucking_company_org:organizations!trucking_company_org_id (
        id,
        name
      ),
      shipping_line_org:organizations!shipping_line_org_id (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })

  // Get marketplace containers (excluding user's company)
  const userOrgId = user?.profile?.organization_id
  const { data: marketplaceContainers, error: marketplaceError } = await supabase
    .from('import_containers')
    .select(`
      id,
      container_number,
      container_type,
      drop_off_location,
      trucking_company_org_id,
      trucking_company_org:organizations!trucking_company_org_id (
        name
      )
    `)
    .eq('is_listed_on_marketplace', true)
    .eq('status', 'AVAILABLE')
    .neq('trucking_company_org_id', userOrgId || '')

  // Get all organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, type')
    .order('name')

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Marketplace Debug Info</h1>
      
      {/* User Info */}
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User Info</h2>
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Role:</strong> {user?.profile?.role || 'N/A'}</p>
        <p><strong>Organization ID:</strong> {user?.profile?.organization_id || 'N/A'}</p>
        <p><strong>Organization Name:</strong> {
          organizations?.find(org => org.id === user?.profile?.organization_id)?.name || 'N/A'
        }</p>
      </div>

      {/* All Containers */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-4">All Import Containers ({allContainers?.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Container Number</th>
                <th className="border border-gray-300 p-2">Type</th>
                <th className="border border-gray-300 p-2">Status</th>
                <th className="border border-gray-300 p-2">Marketplace</th>
                <th className="border border-gray-300 p-2">Trucking Company</th>
                <th className="border border-gray-300 p-2">Shipping Line</th>
                <th className="border border-gray-300 p-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {allContainers?.map((container: any) => (
                <tr key={container.id} className={
                  container.is_listed_on_marketplace ? 'bg-green-50' : 'bg-white'
                }>
                  <td className="border border-gray-300 p-2">{container.container_number}</td>
                  <td className="border border-gray-300 p-2">{container.container_type}</td>
                  <td className="border border-gray-300 p-2">{container.status}</td>
                  <td className="border border-gray-300 p-2">
                    {container.is_listed_on_marketplace ? 
                      <span className="text-green-600 font-bold">✓ Yes</span> : 
                      <span className="text-red-600">✗ No</span>
                    }
                  </td>
                  <td className="border border-gray-300 p-2">
                    {container.trucking_company_org?.name || 'N/A'}
                    <br />
                    <small className="text-gray-500">{container.trucking_company_org_id}</small>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {container.shipping_line_org?.name || 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-2">{container.drop_off_location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketplace Containers (What should show) */}
      <div className="bg-green-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Marketplace Containers (Excluding Current User's Company) ({marketplaceContainers?.length || 0})
        </h2>
        {marketplaceError && (
          <p className="text-red-600 mb-2">Error: {marketplaceError.message}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Container Number</th>
                <th className="border border-gray-300 p-2">Type</th>
                <th className="border border-gray-300 p-2">Trucking Company</th>
                <th className="border border-gray-300 p-2">Company ID</th>
                <th className="border border-gray-300 p-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {marketplaceContainers?.map((container: any) => (
                <tr key={container.id} className="bg-white">
                  <td className="border border-gray-300 p-2">{container.container_number}</td>
                  <td className="border border-gray-300 p-2">{container.container_type}</td>
                  <td className="border border-gray-300 p-2">{container.trucking_company_org?.name || 'N/A'}</td>
                  <td className="border border-gray-300 p-2">
                    <small>{container.trucking_company_org_id}</small>
                  </td>
                  <td className="border border-gray-300 p-2">{container.drop_off_location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organizations */}
      <div className="bg-yellow-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-4">All Organizations ({organizations?.length || 0})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Trucking Companies</h3>
            <ul className="text-sm">
              {organizations?.filter(org => org.type === 'TRUCKING_COMPANY').map(org => (
                <li key={org.id} className={org.id === userOrgId ? 'font-bold text-blue-600' : ''}>
                  {org.name} <small>({org.id})</small>
                  {org.id === userOrgId && <span className="text-blue-600"> ← YOUR COMPANY</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Shipping Lines</h3>
            <ul className="text-sm">
              {organizations?.filter(org => org.type === 'SHIPPING_LINE').map(org => (
                <li key={org.id}>{org.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-red-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Summary & Diagnosis</h2>
        <ul className="text-sm space-y-1">
          <li>• Total containers in database: {allContainers?.length || 0}</li>
          <li>• Containers marked for marketplace: {allContainers?.filter(c => c.is_listed_on_marketplace).length || 0}</li>
          <li>• Containers available for current user: {marketplaceContainers?.length || 0}</li>
          <li>• Current user's organization: {
            organizations?.find(org => org.id === userOrgId)?.name || 'Unknown'
          }</li>
          <li className="font-bold text-red-600">
            {marketplaceContainers?.length === 0 ? 
              '🚨 ISSUE: No containers available for marketplace (all containers might belong to current user)' :
              '✅ Marketplace should work normally'
            }
          </li>
        </ul>
      </div>
    </div>
  )
} 