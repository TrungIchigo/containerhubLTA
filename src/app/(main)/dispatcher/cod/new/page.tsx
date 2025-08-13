import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import NewCodRequestPage from '@/components/features/cod/NewCodRequestPage'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  searchParams: Promise<{
    orderId?: string
  }>
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

async function getCodRequestData(orderId: string) {
  // Validate orderId format
  if (!isValidUUID(orderId)) {
    throw new Error('ID đơn hàng không hợp lệ')
  }

  const supabase = await createClient()

  try {
    // Fetch dữ liệu song song
    const [originalOrderResult, gpgDepotsResult, codFeeMatrixResult] = await Promise.all([
    // Fetch chi tiết lệnh trả rỗng gốc
    supabase
      .from('import_containers')
      .select(
        `
        id,
        container_number,
        container_type,
        drop_off_location,
        depot_id,
        available_from_datetime,
        trucking_company_org_id,
        shipping_line_org_id,
        depot: depots!import_containers_depot_id_fkey(
          id,
          name,
          address,
          latitude,
          longitude
        )
      `
      )
      .eq('id', orderId)
      .single(),

    // Fetch tất cả depot GPG
    supabase
      .from('gpg_depots')
      .select('id, name, address, latitude, longitude')
      .order('name', { ascending: true }),

    // Fetch ma trận phí COD của GPG
    supabase
      .from('gpg_cod_fee_matrix')
      .select('origin_depot_id, destination_depot_id, fee, distance_km'),
  ])

    if (originalOrderResult.error) {
      console.error('Error fetching original order:', originalOrderResult.error)
      if (originalOrderResult.error.code === 'PGRST116') {
        // No rows returned - order not found
        throw new Error('NOTFOUND')
      }
      throw new Error('Không thể tải thông tin lệnh trả rỗng')
    }

    if (gpgDepotsResult.error) {
      console.error('Error fetching GPG depots:', gpgDepotsResult.error)
      throw new Error('Không thể tải danh sách depot GPG')
    }

    if (codFeeMatrixResult.error) {
      console.error('Error fetching COD fee matrix:', codFeeMatrixResult.error)
      throw new Error('Không thể tải bảng phí COD')
    }

  // Transform depot data to match OriginalOrder interface
  const rawOrder = originalOrderResult.data
  const originalOrder = rawOrder
    ? {
        id: rawOrder.id,
        container_number: rawOrder.container_number,
        container_type: rawOrder.container_type,
        drop_off_location: rawOrder.drop_off_location,
        depot_id: rawOrder.depot_id,
        available_from_datetime: rawOrder.available_from_datetime,
        trucking_company_org_id: rawOrder.trucking_company_org_id,
        shipping_line_org_id: rawOrder.shipping_line_org_id,
        depot: (rawOrder.depot && Array.isArray(rawOrder.depot) ? rawOrder.depot[0] : rawOrder.depot) || undefined,
      }
    : null

    return {
      originalOrder,
      gpgDepots: gpgDepotsResult.data || [],
      codFeeMatrix: codFeeMatrixResult.data || [],
    }
  } catch (error) {
    // Re-throw known errors
    if (error instanceof Error) {
      throw error
    }
    // Handle unexpected errors
    console.error('Unexpected error in getCodRequestData:', error)
    throw new Error('Đã xảy ra lỗi không xác định khi tải dữ liệu')
  }
}

function LoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        
        {/* Map area */}
        <div className="flex-1">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
      
      {/* Bottom action bar */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export default async function CodNewRequestPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile()
  
  if (!profile || profile.role !== 'DISPATCHER') {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const { orderId } = resolvedSearchParams
  
  if (!orderId) {
    redirect('/dispatcher/containers')
  }

  // Validate orderId format early
  if (!isValidUUID(orderId)) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CodRequestDataLoader orderId={orderId} />
    </Suspense>
  )
}

async function CodRequestDataLoader({ orderId }: { orderId: string }) {
  try {
    const data = await getCodRequestData(orderId)
    
    if (!data.originalOrder) {
      notFound()
    }
    
    return (
      <NewCodRequestPage
        originalOrder={data.originalOrder}
        gpgDepots={data.gpgDepots}
        codFeeMatrix={data.codFeeMatrix}
      />
    )
  } catch (error) {
    console.error('Error loading COD request data:', error)
    
    // Handle specific error cases
    if (error instanceof Error && error.message === 'NOTFOUND') {
      notFound()
    }
    
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'}
          </p>
          <a 
            href="/dispatcher/containers" 
            className="text-blue-600 hover:underline"
          >
            Quay lại danh sách container
          </a>
        </div>
      </div>
    )
  }
}