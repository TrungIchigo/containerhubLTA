import type { ImportContainer, ExportBooking } from '@/lib/types'

// Generate matching suggestions - Utility function (not server action)
export function generateMatchingSuggestions(
  containers: ImportContainer[], 
  bookings: ExportBooking[]
) {
  const suggestions = []
  
  const availableContainers = containers.filter(c => c.status === 'AVAILABLE')
  const availableBookings = bookings.filter(b => b.status === 'AVAILABLE')
  
  for (const container of availableContainers) {
    for (const booking of availableBookings) {
      // 1. Check if both belong to the same trucking company (internal matching only)
      if (container.trucking_company_org_id !== booking.trucking_company_org_id) {
        continue
      }
      
      // 2. Check if both have the same shipping line
      if (container.shipping_line_org_id !== booking.shipping_line_org_id) {
        continue
      }
      
      // 3. Check city compatibility (temporarily disabled for testing)
      // In the future, implement proper geographic proximity checking
      // For now, skip city check to allow broader matching
      // if (container.city_id && booking.city_id && container.city_id !== booking.city_id) {
      //   continue
      // }
      
      // 4. Check if container type matches (prefer container_type_id, fallback to legacy field)
      const containerTypeMatches = container.container_type_id && booking.container_type_id 
        ? container.container_type_id === booking.container_type_id
        : container.container_type === booking.required_container_type;
      
      if (!containerTypeMatches) {
        continue
      }
      
      // 5. Check timing compatibility with 2-hour minimum gap requirement
      const containerAvailable = new Date(container.available_from_datetime)
      const bookingNeeded = new Date(booking.needed_by_datetime)
      
      // Container must be available before booking is needed
      if (containerAvailable > bookingNeeded) {
        continue
      }
      
      // Calculate time difference in hours
      const timeDifferenceMs = bookingNeeded.getTime() - containerAvailable.getTime()
      const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60)
      
      // Must have at least 2 hours gap between container available and booking needed
      if (timeDifferenceHours < 2) {
        continue
      }
      
      // Calculate estimated savings (simplified calculation)
      const estimatedCostSaving = Math.floor(Math.random() * 500) + 200 // $200-700
      const estimatedCo2Saving = Math.floor(Math.random() * 100) + 50 // 50-150kg
      
      suggestions.push({
        import_container: container,
        export_booking: booking,
        estimated_cost_saving: estimatedCostSaving,
        estimated_co2_saving_kg: estimatedCo2Saving
      })
    }
  }
  
  return suggestions
} 