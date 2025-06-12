'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Building2, Ship, HandHeart } from 'lucide-react'
import CreateMarketplaceRequestDialog from './CreateMarketplaceRequestDialog'
import { RatingDisplay } from '@/components/ui/star-rating'
import { useMarketplaceStore } from '@/stores/marketplace-store'
import type { MarketplaceListing } from '@/lib/types'

interface MarketplaceListingsTableProps {
  listings: MarketplaceListing[]
}

export default function MarketplaceListingsTable({ listings }: MarketplaceListingsTableProps) {
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Zustand store for map-table interaction
  const { 
    hoveredListingId, 
    selectedListingId, 
    setHoveredListingId, 
    setSelectedListingId 
  } = useMarketplaceStore()
  
  // Refs for auto-scrolling to selected rows
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  
  // Auto-scroll to selected listing when it changes from map
  useEffect(() => {
    if (selectedListingId) {
      const selectedRow = rowRefs.current[selectedListingId]
      if (selectedRow) {
        selectedRow.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Scroll to center of the viewport
        })
      }
    }
  }, [selectedListingId])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCreateRequest = (listing: MarketplaceListing) => {
    setSelectedListing(listing)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedListing(null)
  }

  if (listings.length === 0) {
    return (
      <Card className="card">
        <CardContent className="text-center py-12">
          <HandHeart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-h3 text-text-primary mb-2">
            Không tìm thấy cơ hội nào
          </h3>
          <p className="text-body text-text-secondary">
            Hiện tại không có lệnh giao trả nào phù hợp với bộ lọc của bạn.
          </p>
          <p className="text-body-small text-text-secondary mt-2">
            Hãy thử điều chỉnh bộ lọc hoặc quay lại sau để xem các cơ hội mới.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
            <HandHeart className="w-6 h-6 text-primary" />
            Cơ Hội Có Sẵn
            <Badge className="ml-2" variant="secondary">
              {listings.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Container</th>
                  <th className="table-header">Công ty cung cấp</th>
                  <th className="table-header">Hãng tàu</th>
                  <th className="table-header">Địa điểm giao trả</th>
                  <th className="table-header">Thời gian rảnh</th>
                  <th className="table-header text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr 
                    key={listing.id} 
                    ref={el => { rowRefs.current[listing.id] = el }}
                    className={`table-row cursor-pointer transition-colors ${
                      selectedListingId === listing.id 
                        ? 'bg-primary/10 border-l-4 border-l-primary' 
                        : hoveredListingId === listing.id
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    onClick={() => setSelectedListingId(listing.id)}
                  >
                    {/* Container Info */}
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="text-label text-text-primary font-medium">
                          {listing.container_number}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {listing.container_type}
                        </Badge>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-primary">
                            {listing.trucking_company.name}
                          </span>
                        </div>
                        {listing.rating_details && (
                          <RatingDisplay
                            rating={listing.rating_details.average_rating}
                            reviewCount={listing.rating_details.review_count}
                            size="sm"
                            showText={true}
                            className="text-xs"
                          />
                        )}
                      </div>
                    </td>

                    {/* Shipping Line */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">
                          {listing.shipping_line.name}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">
                          {listing.drop_off_location}
                        </span>
                      </div>
                    </td>

                    {/* Available Time */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary text-sm">
                          {formatDateTime(listing.available_from_datetime)}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="table-cell text-center">
                      <Button
                        onClick={() => handleCreateRequest(listing)}
                        className="bg-primary hover:bg-primary-dark text-white"
                        size="sm"
                      >
                        <HandHeart className="w-4 h-4 mr-2" />
                        Tạo Yêu Cầu
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Marketplace Request Dialog */}
      {selectedListing && (
        <CreateMarketplaceRequestDialog
          listing={selectedListing}
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  )
} 