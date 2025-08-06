import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Query for invoices related to COD fees and reuse fees
    const { data: codInvoices, error: codError } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        description,
        created_at,
        status,
        transaction_type,
        cod_requests!inner (
          container_number,
          organizations!requesting_org_id (
            name
          )
        )
      `)
      .in('transaction_type', ['COD_FEE', 'REUSE_FEE'])
      .order('created_at', { ascending: false })

    if (codError) {
      console.error('Error fetching COD related invoices:', codError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch COD related invoices' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedData = codInvoices?.map(transaction => ({
      id: transaction.id,
      invoice_number: `INV-${transaction.id.slice(-8).toUpperCase()}`,
      container_number: transaction.cod_requests?.[0]?.container_number || 'N/A',
      fee_type: transaction.transaction_type === 'COD_FEE' ? 'COD' : 'REUSE',
      company_name: transaction.cod_requests?.[0]?.organizations?.[0]?.name || 'Unknown',
      amount: transaction.amount,
      created_at: transaction.created_at,
      status: transaction.status,
      description: transaction.description
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedData
    })
  } catch (error) {
    console.error('Error in COD related invoices API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}