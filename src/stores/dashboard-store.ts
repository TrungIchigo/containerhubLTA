import { create } from 'zustand'

interface DashboardState {
  selectedDropOffOrderId: string | null
  selectedPickupOrderId: string | null
  selectedSuggestionId: string | null
  setSelectedDropOffOrder: (id: string | null) => void
  setSelectedPickupOrder: (id: string | null) => void
  setSelectedSuggestion: (id: string | null) => void
  clearAllSelections: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedDropOffOrderId: null,
  selectedPickupOrderId: null,
  selectedSuggestionId: null,
  setSelectedDropOffOrder: (id) => set({ 
    selectedDropOffOrderId: id,
    // Clear other selections when selecting dropoff order
    selectedSuggestionId: null,
    selectedPickupOrderId: null
  }),
  setSelectedPickupOrder: (id) => set({ 
    selectedPickupOrderId: id,
    // Clear other selections when selecting pickup order
    selectedSuggestionId: null,
    selectedDropOffOrderId: null
  }),
  setSelectedSuggestion: (id) => set({ 
    selectedSuggestionId: id,
    // Don't clear other selections as suggestion might involve both
  }),
  clearAllSelections: () => set({
    selectedDropOffOrderId: null,
    selectedPickupOrderId: null,
    selectedSuggestionId: null
  })
})) 