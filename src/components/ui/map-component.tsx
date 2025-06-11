'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MarketplaceListing } from '@/lib/types'

interface MapComponentProps {
  listings: MarketplaceListing[]
  className?: string
  height?: string
}

export default function MapComponent({ 
  listings, 
  className = "w-full", 
  height = "400px" 
}: MapComponentProps) {
  const [isReady, setIsReady] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  // Fix for default markers in React-Leaflet - only run once
  useEffect(() => {
    if (!hasInitialized.current) {
      try {
        // Fix for Leaflet icons in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        })
        
        hasInitialized.current = true
        setIsReady(true)
      } catch (error) {
        console.warn('Error setting up Leaflet icons:', error)
        hasInitialized.current = true
        setIsReady(true)
      }
    } else {
      setIsReady(true)
    }
  }, [])

  // Filter listings that have coordinates
  const listingsWithCoords = listings.filter(
    listing => listing.latitude !== null && listing.longitude !== null
  )

  // Default center (Ho Chi Minh City)
  const defaultCenter: [number, number] = [10.8231, 106.6297]
  
  // Calculate map center based on listings
  const mapCenter: [number, number] = listingsWithCoords.length > 0 
    ? [
        listingsWithCoords.reduce((sum, listing) => sum + (listing.latitude || 0), 0) / listingsWithCoords.length,
        listingsWithCoords.reduce((sum, listing) => sum + (listing.longitude || 0), 0) / listingsWithCoords.length
      ]
    : defaultCenter

  // Show message when no listings with coordinates
  if (listings.length > 0 && listingsWithCoords.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Chưa có tọa độ địa điểm
            </h3>
            <p className="text-sm text-gray-600">
              Các container trong danh sách chưa có thông tin tọa độ để hiển thị trên bản đồ.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className={className} style={{ height }}>
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Đang khởi tạo bản đồ...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={listingsWithCoords.length > 0 ? 11 : 10}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {listingsWithCoords.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude!, listing.longitude!]}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-sm mb-2">
                  {listing.container_number}
                </h3>
                <div className="space-y-1 text-xs">
                  <p><strong>Loại Container:</strong> {listing.container_type}</p>
                  <p><strong>Địa Điểm:</strong> {listing.drop_off_location}</p>
                  <p><strong>Có Sẵn Từ:</strong> {new Date(listing.available_from_datetime).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Hãng Tàu:</strong> {listing.shipping_line.name}</p>
                  <p><strong>Công Ty Vận Tải:</strong> {listing.trucking_company.name}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
} 