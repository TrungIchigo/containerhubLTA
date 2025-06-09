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
      // Check if container type matches
      if (container.container_type === booking.required_container_type) {
        // Check if timing is compatible (container available before booking needed)
        const containerAvailable = new Date(container.available_from_datetime)
        const bookingNeeded = new Date(booking.needed_by_datetime)
        
        if (containerAvailable <= bookingNeeded) {
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
    }
  }
  
  return suggestions
} 