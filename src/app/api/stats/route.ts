import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get approved street turn requests
    const { data: approvedRequests, error } = await supabase
      .from('street_turn_requests')
      .select('estimated_cost_saving, estimated_co2_saving_kg')
      .eq('status', 'APPROVED')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals
    const totalCostSaving = approvedRequests?.reduce(
      (sum, req) => sum + (req.estimated_cost_saving || 0), 
      0
    ) || 0

    const totalCo2Saving = approvedRequests?.reduce(
      (sum, req) => sum + (req.estimated_co2_saving_kg || 0), 
      0
    ) || 0

    const totalStreetTurns = approvedRequests?.length || 0

    return NextResponse.json({
      totalCostSaving,
      totalCo2Saving,
      totalStreetTurns,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 