import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface DashboardFilters {
  start_date?: string
  end_date?: string
  range?: string
}

export interface DashboardStats {
  summary: {
    total_cost_saving: number
    total_co2_saving: number
    successful_street_turns: number
    approval_rate: number
    total_requests: number
    approved_requests: number
    declined_requests: number
    pending_requests: number
  }
  date_range: {
    start_date: string
    end_date: string
  }
  organization_role: string
}

export interface TrendDataPoint {
  date: string
  approved: number
  declined: number
  pending: number
  total: number
}

export interface DashboardTrendData {
  trend_data: TrendDataPoint[]
  status_distribution: {
    approved: number
    declined: number
    pending: number
  }
  date_range: {
    start_date: string
    end_date: string
  }
}

const getDateRangeFromFilters = (filters: DashboardFilters) => {
  // If custom dates are provided, use them
  if (filters.start_date && filters.end_date) {
    return {
      start_date: filters.start_date,
      end_date: filters.end_date
    }
  }

  // Otherwise, generate from range
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (filters.range) {
    case 'week':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      return {
        start_date: startOfWeek.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
      }
    
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3)
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1)
      return {
        start_date: startOfQuarter.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
      }
    
    case 'year':
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return {
        start_date: startOfYear.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
      }
    
    case 'month':
    default:
      // Default to current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0]
      }
  }
}

export async function getDashboardStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  // Get date range
  const { start_date, end_date } = getDateRangeFromFilters(filters)

  try {
    // For now, return mock data since we don't have the RPC function set up yet
    // TODO: Replace with actual RPC call once Supabase function is deployed
    const mockStats: DashboardStats = {
      summary: {
        total_cost_saving: 150000000, // 150M VND
        total_co2_saving: 1200, // kg
        successful_street_turns: 45,
        approval_rate: 85.5,
        total_requests: 53,
        approved_requests: 45,
        declined_requests: 6,
        pending_requests: 2
      },
      date_range: {
        start_date,
        end_date
      },
      organization_role: profile.role === 'DISPATCHER' ? 'TRUCKING_COMPANY' : 'SHIPPING_LINE'
    }

    return mockStats

    // Actual RPC call (uncomment when ready):
    /*
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      org_id: profile.organization_id,
      start_date,
      end_date
    })

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      throw new Error('Failed to fetch dashboard statistics')
    }

    return data as DashboardStats
    */
  } catch (error) {
    console.error('Dashboard stats error:', error)
    throw new Error('Failed to load dashboard data')
  }
}

export async function getDashboardTrendData(filters: DashboardFilters = {}): Promise<DashboardTrendData> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  // Get date range
  const { start_date, end_date } = getDateRangeFromFilters(filters)

  try {
    // Mock trend data for testing
    const generateMockTrendData = () => {
      const data: TrendDataPoint[] = []
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        data.push({
          date: d.toISOString().split('T')[0],
          approved: Math.floor(Math.random() * 5) + 1,
          declined: Math.floor(Math.random() * 2),
          pending: Math.floor(Math.random() * 3),
          total: 0 // Will be calculated
        })
      }
      
      // Calculate totals
      data.forEach(item => {
        item.total = item.approved + item.declined + item.pending
      })
      
      return data
    }

    const mockTrendData: DashboardTrendData = {
      trend_data: generateMockTrendData(),
      status_distribution: {
        approved: 45,
        declined: 6,
        pending: 2
      },
      date_range: {
        start_date,
        end_date
      }
    }

    return mockTrendData

    // Actual RPC call (uncomment when ready):
    /*
    const { data, error } = await supabase.rpc('get_dashboard_trend_data', {
      org_id: profile.organization_id,
      start_date,
      end_date
    })

    if (error) {
      console.error('Error fetching dashboard trend data:', error)
      throw new Error('Failed to fetch dashboard trend data')
    }

    return data as DashboardTrendData
    */
  } catch (error) {
    console.error('Dashboard trend data error:', error)
    throw new Error('Failed to load dashboard trend data')
  }
} 