'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { createMarketplaceFee } from './billing'
import type { MarketplaceFilters, MarketplaceListing, CreateMarketplaceRequestForm, Organization } from '@/lib/types'

// Get marketplace listings with filters
export async function getMarketplaceListings(filters: MarketplaceFilters = {}) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const userOrgId = user.profile.organization_id

  // Build query with filters
  let query = supabase
    .from('import_containers')
    .select(`
      id,
      container_number,
      container_type,
      drop_off_location,
      available_from_datetime,
      latitude,
      longitude,
      shipping_line_org_id,
      trucking_company_org_id,
      shipping_line_org:organizations!shipping_line_org_id (
        id,
        name
      ),
      trucking_company_org:organizations!trucking_company_org_id (
        id,
        name
      )
    `)
    .eq('is_listed_on_marketplace', true)
    .eq('status', 'AVAILABLE')
    
  // Only exclude own company if we have a valid organization ID
  if (userOrgId) {
    query = query.neq('trucking_company_org_id', userOrgId)
  }

  // Apply filters
  if (filters.container_type) {
    query = query.eq('container_type', filters.container_type)
  }

  if (filters.location) {
    query = query.ilike('drop_off_location', `%${filters.location}%`)
  }

  // Apply date range filter
  if (filters.start_date && filters.end_date) {
    query = query
      .gte('available_from_datetime', filters.start_date)
      .lte('available_from_datetime', filters.end_date)
  }

  // Execute query
  const { data: rawListings, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching marketplace listings:', error)
    throw error
  }

  // Fetch rating details for each organization in parallel - with error handling
  const organizationIds = [...new Set(rawListings?.map(item => item.trucking_company_org_id).filter(Boolean) || [])]
  let ratingsMap: Record<string, any> = {}
  
  try {
    const ratingPromises = organizationIds.map(async (orgId) => {
      try {
        const { data: ratingData } = await supabase.rpc('get_org_rating_details', { org_id: orgId })
        return { orgId, ...ratingData }
      } catch (error) {
        console.warn(`Failed to get rating for org ${orgId}:`, error)
        return { orgId, average_rating: 0, review_count: 0 }
      }
    })
    
    const ratings = await Promise.all(ratingPromises)
    ratingsMap = ratings.reduce((acc, rating) => {
      acc[rating.orgId] = rating
      return acc
    }, {} as Record<string, any>)
  } catch (error) {
    console.warn('Failed to fetch ratings, using defaults:', error)
  }

  // Transform data to match MarketplaceListing interface
  const listings: MarketplaceListing[] = (rawListings || []).map((item: any) => ({
    id: item.id,
    container_number: item.container_number,
    container_type: item.container_type,
    drop_off_location: item.drop_off_location,
    available_from_datetime: item.available_from_datetime,
    latitude: item.latitude,
    longitude: item.longitude,
    shipping_line: {
      id: item.shipping_line_org?.id || '',
      name: item.shipping_line_org?.name || 'Unknown',
      type: 'SHIPPING_LINE' as const,
      status: 'ACTIVE',
      created_at: ''
    },
    trucking_company: {
      id: item.trucking_company_org?.id || '',
      name: item.trucking_company_org?.name || 'Unknown',
      type: 'TRUCKING_COMPANY' as const,
      status: 'ACTIVE',
      created_at: ''
    },
    rating_details: ratingsMap[item.trucking_company_org_id] || { average_rating: 0, review_count: 0 }
  }))

  // Apply shipping line filter if provided
  let filteredListings = listings
  if (filters.shipping_line_name) {
    filteredListings = filteredListings.filter(listing => 
      listing.shipping_line.name.toLowerCase().includes(filters.shipping_line_name!.toLowerCase())
    )
  }

  // Apply rating filter if provided
  if (filters.min_rating && filters.min_rating > 0) {
    filteredListings = filteredListings.filter(listing => 
      listing.rating_details && listing.rating_details.average_rating >= filters.min_rating!
    )
  }

  return filteredListings
}

// Get user's export bookings for dropdown selection
export async function getUserExportBookings() {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  const { data: bookings, error } = await supabase
    .from('export_bookings')
    .select('id, booking_number, required_container_type, pick_up_location, needed_by_datetime')
    .eq('trucking_company_org_id', user.profile.organization_id)
    .eq('status', 'AVAILABLE')
    .order('needed_by_datetime', { ascending: true })

  if (error) {
    console.error('Error fetching export bookings:', error)
    throw error
  }

  return bookings || []
}

// Create marketplace request (cross-company pairing)
export async function createMarketplaceRequest(formData: CreateMarketplaceRequestForm) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  // Get container details to validate and find approving organization
  const { data: container, error: containerError } = await supabase
    .from('import_containers')
    .select(`
      id,
      shipping_line_org_id,
      trucking_company_org_id,
      container_type,
      is_listed_on_marketplace,
      status
    `)
    .eq('id', formData.dropoff_container_id)
    .single()

  if (containerError || !container) {
    throw new Error('Container not found')
  }

  // Validate container is available on marketplace
  if (!container.is_listed_on_marketplace || container.status !== 'AVAILABLE') {
    throw new Error('Container is not available on marketplace')
  }

  // Get booking details to validate compatibility
  const { data: booking, error: bookingError } = await supabase
    .from('export_bookings')
    .select(`
      id,
      required_container_type,
      trucking_company_org_id,
      status
    `)
    .eq('id', formData.pickup_booking_id)
    .single()

  if (bookingError || !booking) {
    throw new Error('Booking not found')
  }

  // Validate booking belongs to current user's organization
  if (booking.trucking_company_org_id !== user.profile.organization_id) {
    throw new Error('Booking does not belong to your organization')
  }

  // Validate container type compatibility
  if (container.container_type !== booking.required_container_type) {
    throw new Error('Container type mismatch')
  }

  // Validate booking is available
  if (booking.status !== 'AVAILABLE') {
    throw new Error('Booking is not available')
  }

  // Create the marketplace request
  const { error: requestError } = await supabase
    .from('street_turn_requests')
    .insert({
      import_container_id: formData.dropoff_container_id,
      export_booking_id: formData.pickup_booking_id,
      dropoff_trucking_org_id: container.trucking_company_org_id,
      pickup_trucking_org_id: user.profile.organization_id,
      approving_org_id: container.shipping_line_org_id,
      match_type: 'MARKETPLACE',
      dropoff_org_approval_status: 'PENDING',
      status: 'PENDING',
      estimated_cost_saving: formData.estimated_cost_saving,
      estimated_co2_saving_kg: formData.estimated_co2_saving_kg
    })

  if (requestError) {
    console.error('Error creating marketplace request:', requestError)
    throw requestError
  }

  // Update container and booking status to AWAITING_REUSE_APPROVAL
  const [containerUpdateResult, bookingUpdateResult] = await Promise.all([
    supabase
      .from('import_containers')
      .update({ status: 'AWAITING_REUSE_APPROVAL' })
      .eq('id', formData.dropoff_container_id),
    
    supabase
      .from('export_bookings')
      .update({ status: 'AWAITING_APPROVAL' })
      .eq('id', formData.pickup_booking_id)
  ])

  if (containerUpdateResult.error) {
    console.error('Error updating container status:', containerUpdateResult.error)
    throw containerUpdateResult.error
  }

  if (bookingUpdateResult.error) {
    console.error('Error updating booking status:', bookingUpdateResult.error)
    throw bookingUpdateResult.error
  }

  // Revalidate related paths
  revalidatePath('/marketplace')
  revalidatePath('/dispatcher')
  revalidatePath('/dispatcher/requests')
}

// Handle partner approval (for dropoff company)
export async function handlePartnerApproval(requestId: string, decision: 'APPROVED' | 'DECLINED') {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  // Get request details to validate authorization
  const { data: request, error: requestError } = await supabase
    .from('street_turn_requests')
    .select(`
      id,
      dropoff_trucking_org_id,
      import_container_id,
      export_booking_id,
      match_type,
      dropoff_org_approval_status
    `)
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    throw new Error('Request not found')
  }

  // Validate user has permission to approve (is from dropoff company)
  if (request.dropoff_trucking_org_id !== user.profile.organization_id) {
    throw new Error('Unauthorized to approve this request')
  }

  // Validate request is marketplace type and pending
  if (request.match_type !== 'MARKETPLACE' || request.dropoff_org_approval_status !== 'PENDING') {
    throw new Error('Request is not eligible for partner approval')
  }

  // Update approval status
  const { error: updateError } = await supabase
    .from('street_turn_requests')
    .update({ 
      dropoff_org_approval_status: decision 
    })
    .eq('id', requestId)

  if (updateError) {
    console.error('Error updating partner approval:', updateError)
    throw updateError
  }

  // If declined, revert container and booking status to AVAILABLE
  if (decision === 'DECLINED') {
    await Promise.all([
      supabase
        .from('import_containers')
        .update({ status: 'AVAILABLE' })
        .eq('id', request.import_container_id),
      
      supabase
        .from('export_bookings')
        .update({ status: 'AVAILABLE' })
        .eq('id', request.export_booking_id)
    ])
  }

  // Revalidate related paths
  revalidatePath('/dispatcher/requests')
  revalidatePath('/marketplace')
}

// Get shipping lines for filter combobox
export async function getShippingLinesForFilter(): Promise<Organization[]> {
  const supabase = await createClient()
  
  const { data: shippingLines, error } = await supabase
    .from('organizations')
    .select('id, name, type, status, created_at')
    .eq('type', 'SHIPPING_LINE')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching shipping lines:', error)
    throw error
  }

  return shippingLines || []
} 