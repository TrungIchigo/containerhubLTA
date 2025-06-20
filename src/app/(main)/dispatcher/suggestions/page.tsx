'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MatchSuggestions from '@/components/dispatcher/MatchSuggestions'
import SuggestionFilters from '@/components/dispatcher/SuggestionFilters'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import { createClient } from '@/lib/supabase/client'

export default function SuggestionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [allSuggestions, setAllSuggestions] = useState<any[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'DISPATCHER') {
        router.push('/dashboard')
        return
      }

      // Load data
      const orgId = profile.organization_id

      // Get import containers
      const { data: importContainers, error: containersError } = await supabase
        .from('import_containers')
        .select(`
          *,
          shipping_line:organizations!import_containers_shipping_line_org_id_fkey(*),
          trucking_company:organizations!import_containers_trucking_company_org_id_fkey(*)
        `)
        .eq('trucking_company_org_id', orgId)
        .eq('status', 'AVAILABLE')

      if (containersError) throw containersError

      // Get export bookings
      const { data: exportBookingsRaw, error: bookingsError } = await supabase
        .from('export_bookings')
        .select('*')
        .eq('trucking_company_org_id', orgId)
        .eq('status', 'AVAILABLE')

      if (bookingsError) throw bookingsError

      // Get shipping lines for bookings
      const shippingLineIds = exportBookingsRaw
        ?.filter(booking => booking.shipping_line_org_id)
        .map(booking => booking.shipping_line_org_id) || []

      let shippingLinesForBookings: any[] = []
      if (shippingLineIds.length > 0) {
        const { data: shippingLinesData } = await supabase
          .from('organizations')
          .select('*')
          .in('id', shippingLineIds)
        
        shippingLinesForBookings = shippingLinesData || []
      }

      const exportBookings = exportBookingsRaw?.map(booking => ({
        ...booking,
        shipping_line: shippingLinesForBookings.find(sl => sl.id === booking.shipping_line_org_id) || null
      })) || []

      // Get all shipping lines
      const { data: shippingLines } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'SHIPPING_LINE')
        .order('name')

      // Generate suggestions
      const suggestions = generateMatchingSuggestions(importContainers || [], exportBookings || [])

      const loadedData = {
        importContainers: importContainers || [],
        exportBookings: exportBookings || [],
        shippingLines: shippingLines || []
      }

      setData(loadedData)
      setAllSuggestions(suggestions)
      setFilteredSuggestions(suggestions)

    } catch (err: any) {
      console.error('Error loading suggestions:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Simple matching logic
  const generateMatchingSuggestions = (containers: any[], bookings: any[]) => {
    const suggestions: any[] = []
    
    containers.forEach(container => {
      bookings.forEach(booking => {
        if (container.container_type !== booking.required_container_type) return
        if (container.shipping_line?.id !== booking.shipping_line_org_id) return
        
        // Basic cost/co2 calculation
        const estimated_cost_saving = Math.floor(Math.random() * 500) + 100
        const estimated_co2_saving_kg = Math.floor(Math.random() * 200) + 50
        
        suggestions.push({
          import_container: container,
          export_booking: booking,
          estimated_cost_saving,
          estimated_co2_saving_kg
        })
      })
    })
    
    return suggestions
  }

  const handleFiltersChange = (filters: any) => {
    if (!allSuggestions) return

    let filtered = [...allSuggestions]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(suggestion =>
        suggestion.import_container.container_number?.toLowerCase().includes(searchLower) ||
        suggestion.export_booking.booking_number?.toLowerCase().includes(searchLower) ||
        suggestion.import_container.drop_off_location?.toLowerCase().includes(searchLower) ||
        suggestion.export_booking.pick_up_location?.toLowerCase().includes(searchLower)
      )
    }

    // Apply container type filter
    if (filters.containerType) {
      filtered = filtered.filter(suggestion => 
        suggestion.import_container.container_type === filters.containerType
      )
    }

    // Apply shipping line filter
    if (filters.shippingLine) {
      filtered = filtered.filter(suggestion => 
        suggestion.import_container.shipping_line?.id === filters.shippingLine
      )
    }

    // Apply minimum saving filter
    if (filters.minSaving) {
      const minAmount = parseInt(filters.minSaving)
      filtered = filtered.filter(suggestion => 
        suggestion.estimated_cost_saving >= minAmount
      )
    }

    // Apply sorting
    if (filters.sortBy === 'cost_saving_desc') {
      filtered.sort((a, b) => b.estimated_cost_saving - a.estimated_cost_saving)
    } else if (filters.sortBy === 'cost_saving_asc') {
      filtered.sort((a, b) => a.estimated_cost_saving - b.estimated_cost_saving)
    } else if (filters.sortBy === 'co2_saving_desc') {
      filtered.sort((a, b) => b.estimated_co2_saving_kg - a.estimated_co2_saving_kg)
    } else if (filters.sortBy === 'co2_saving_asc') {
      filtered.sort((a, b) => a.estimated_co2_saving_kg - b.estimated_co2_saving_kg)
    }

    setFilteredSuggestions(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Có lỗi xảy ra
          </h1>
          <p className="text-text-secondary mb-6">
            Không thể tải danh sách gợi ý. Vui lòng thử lại sau.
          </p>
          <Button asChild>
            <Link href="/dispatcher">Quay lại Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DispatcherDashboardWrapper 
      userOrgId={data?.importContainers[0]?.trucking_company_org_id || ''}
      shippingLines={data?.shippingLines || []}
    >
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dispatcher">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Gợi Ý Tái Sử Dụng Tốt Nhất
              </h1>
              <p className="text-text-secondary">
                Danh sách chi tiết tất cả cơ hội tái sử dụng container ({filteredSuggestions.length} kết quả)
              </p>
            </div>
          </div>

          {/* Filters */}
          <SuggestionFilters
            onFiltersChange={handleFiltersChange}
            shippingLines={data?.shippingLines || []}
          />

          {/* Content */}
          <MatchSuggestions suggestions={filteredSuggestions} />
        </div>
      </div>
    </DispatcherDashboardWrapper>
  )
} 