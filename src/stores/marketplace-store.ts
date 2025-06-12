import { create } from 'zustand';

interface MarketplaceState {
  hoveredListingId: string | null;
  selectedListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
  setSelectedListingId: (id: string | null) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  hoveredListingId: null,
  selectedListingId: null,
  setHoveredListingId: (id) => set({ hoveredListingId: id }),
  setSelectedListingId: (id) => set({ selectedListingId: id }),
})); 