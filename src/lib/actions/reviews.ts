'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

interface SubmitReviewParams {
  requestId: string
  revieweeOrgId: string
  rating: number
  comment: string | null
}

export async function submitReview({
  requestId,
  revieweeOrgId,
  rating,
  comment
}: SubmitReviewParams) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Verify the request exists and involves the current user's organization
  const { data: request, error: requestError } = await supabase
    .from('street_turn_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    throw new Error('Request not found')
  }

  // Check if user is involved in this marketplace transaction
  const userOrgId = user.profile.organization_id
  const isInvolved = request.dropoff_trucking_org_id === userOrgId || 
                    request.pickup_trucking_org_id === userOrgId

  if (!isInvolved) {
    throw new Error('You are not involved in this transaction')
  }

  // Check if this is a marketplace transaction and it's approved
  if (request.match_type !== 'MARKETPLACE' || request.status !== 'APPROVED') {
    throw new Error('Can only review approved marketplace transactions')
  }

  // Check if user hasn't already reviewed this transaction
  const { data: existingReview } = await supabase
    .from('partner_reviews')
    .select('id')
    .eq('request_id', requestId)
    .eq('reviewer_org_id', userOrgId)
    .single()

  if (existingReview) {
    throw new Error('You have already reviewed this transaction')
  }

  // Insert the review
  const { error: insertError } = await supabase
    .from('partner_reviews')
    .insert({
      request_id: requestId,
      reviewer_org_id: userOrgId,
      reviewee_org_id: revieweeOrgId,
      rating,
      comment
    })

  if (insertError) {
    console.error('Error inserting review:', insertError)
    throw new Error('Failed to submit review')
  }

  // Revalidate the requests page to refresh the UI
  revalidatePath('/dispatcher/requests')
  revalidatePath('/marketplace')
}

// Get reviews for a specific organization
export async function getOrganizationReviews(orgId: string) {
  const supabase = await createClient()
  
  const { data: reviews, error } = await supabase
    .from('partner_reviews')
    .select(`
      *,
      reviewer_org:organizations!reviewer_org_id(name),
      request:street_turn_requests!request_id(*)
    `)
    .eq('reviewee_org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  return reviews || []
}

// Check if user can review a specific request
export async function canReviewRequest(requestId: string) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id) {
    return false
  }

  const supabase = await createClient()
  const userOrgId = user.profile.organization_id

  // Check if request exists and is reviewable
  const { data: request } = await supabase
    .from('street_turn_requests')
    .select('*')
    .eq('id', requestId)
    .eq('match_type', 'MARKETPLACE')
    .eq('status', 'APPROVED')
    .single()

  if (!request) {
    return false
  }

  // Check if user is involved
  const isInvolved = request.dropoff_trucking_org_id === userOrgId || 
                    request.pickup_trucking_org_id === userOrgId

  if (!isInvolved) {
    return false
  }

  // Check if user hasn't already reviewed
  const { data: existingReview } = await supabase
    .from('partner_reviews')
    .select('id')
    .eq('request_id', requestId)
    .eq('reviewer_org_id', userOrgId)
    .single()

  return !existingReview
} 