import { NextRequest, NextResponse } from 'next/server'
import { executeEDepotApiStep } from '@/lib/actions/edepot-api'

/**
 * GET /api/edepot/wallet
 * Retrieves wallet information from eDepot API
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Login to get main token
    const loginResult = await executeEDepotApiStep(1, {
      credentials: {
        user: process.env.EDEPOT_USERNAME || '',
        password: process.env.EDEPOT_PASSWORD || ''
      }
    })

    if (!loginResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to login to eDepot API'
      }, { status: 500 })
    }

    const mainToken = loginResult.data.token

    // Step 2: Get request token
    const tokenResult = await executeEDepotApiStep(2, {
      mainToken,
      endpoint: 'ViLTA_GetDefaultWallet'
    })

    if (!tokenResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get request token'
      }, { status: 500 })
    }

    const { token: reqToken, reqtime: reqTime } = tokenResult.data

    // Step 3: Call API endpoint
    const apiResult = await executeEDepotApiStep(3, {
      mainToken,
      reqToken,
      reqTime,
      endpoint: 'ViLTA_GetDefaultWallet'
    })

    if (!apiResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to call eDepot API'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: apiResult.data.data // Return the data array from API response
    })

  } catch (error) {
    console.error('eDepot wallet API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}