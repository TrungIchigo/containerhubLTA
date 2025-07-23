'use client'

import { useDashboardStore } from '@/stores/dashboard-store'
import { SuggestionDetails } from './SuggestionDetails'
import { RelatedSuggestionsForDropOffOrder } from './RelatedSuggestionsForDropOffOrder'
import { RelatedSuggestionsForPickupOrder } from './RelatedSuggestionsForPickupOrder'
import { DefaultSidebarState } from './DefaultSidebarState'

interface ContextualSidebarProps {
  importContainers: any[]
  exportBookings: any[]
  matchSuggestions: any[]
}

export function ContextualSidebar({ 
  importContainers, 
  exportBookings, 
  matchSuggestions 
}: ContextualSidebarProps) {
  const { 
    selectedSuggestionId, 
    selectedDropOffOrderId, 
    selectedPickupOrderId 
  } = useDashboardStore()

  // Ưu tiên hiển thị chi tiết của Gợi ý được chọn
  if (selectedSuggestionId) {
    return (
      <SuggestionDetails 
        suggestionId={selectedSuggestionId} 
        matchSuggestions={matchSuggestions}
        importContainers={importContainers}
        exportBookings={exportBookings}
      />
    )
  }

  // Nếu không có gợi ý nào được chọn, thì hiển thị gợi ý cho Lệnh được chọn
  if (selectedDropOffOrderId) {
    return (
      <RelatedSuggestionsForDropOffOrder 
        orderId={selectedDropOffOrderId}
        importContainers={importContainers}
        exportBookings={exportBookings}
        matchSuggestions={matchSuggestions}
      />
    )
  }
  
  if (selectedPickupOrderId) {
    return (
      <RelatedSuggestionsForPickupOrder 
        orderId={selectedPickupOrderId}
        importContainers={importContainers}
        exportBookings={exportBookings}
        matchSuggestions={matchSuggestions}
      />
    )
  }

  // Trạng thái mặc định khi không có gì được chọn
  return <DefaultSidebarState />
} 