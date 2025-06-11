'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MarketplaceListing } from '@/lib/types'

interface SimpleMapProps {
  listings: MarketplaceListing[]
  className?: string
  height?: string
}

export default function SimpleMap({ 
  listings, 
  className = "w-full", 
  height = "400px" 
}: SimpleMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Filter listings that have coordinates
  const listingsWithCoords = listings.filter(
    listing => listing.latitude !== null && listing.longitude !== null
  )

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    try {
      // Fix Leaflet icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      })

      // Create map
      const map = L.map(containerRef.current, {
        center: [10.8231, 106.6297], // Ho Chi Minh City
        zoom: 10,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map)

      mapRef.current = map

    } catch (error) {
      console.error('Error initializing map:', error)
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when listings change
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Add new markers
    if (listingsWithCoords.length > 0) {
      const newMarkers: L.Marker[] = []

      listingsWithCoords.forEach(listing => {
        const marker = L.marker([listing.latitude!, listing.longitude!])
          .addTo(mapRef.current!)
          .bindPopup(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">
                ${listing.container_number}
              </h3>
              <div style="font-size: 12px; line-height: 1.4;">
                <p><strong>Loại Container:</strong> ${listing.container_type}</p>
                <p><strong>Địa Điểm:</strong> ${listing.drop_off_location}</p>
                <p><strong>Có Sẵn Từ:</strong> ${new Date(listing.available_from_datetime).toLocaleDateString('vi-VN')}</p>
                <p><strong>Hãng Tàu:</strong> ${listing.shipping_line.name}</p>
                <p><strong>Công Ty Vận Tải:</strong> ${listing.trucking_company.name}</p>
              </div>
            </div>
          `)

        newMarkers.push(marker)
      })

      markersRef.current = newMarkers

      // Fit bounds to show all markers
      if (newMarkers.length > 1) {
        const group = new L.FeatureGroup(newMarkers)
        mapRef.current.fitBounds(group.getBounds().pad(0.1))
      } else if (newMarkers.length === 1) {
        mapRef.current.setView([listingsWithCoords[0].latitude!, listingsWithCoords[0].longitude!], 13)
      }
    }
  }, [listingsWithCoords])

  // Show message when no coordinates
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

  return (
    <div className={className} style={{ height }}>
      <div 
        ref={containerRef}
        className="w-full h-full rounded-lg"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  )
} 