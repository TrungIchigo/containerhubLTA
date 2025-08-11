'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

// Dynamic imports để tránh SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const loadLeafletAssets = async () => {
  if (typeof window !== 'undefined') {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet Routing Machine CSS
    if (!document.querySelector('link[href*="leaflet-routing-machine"]')) {
      const routingLink = document.createElement('link')
      routingLink.rel = 'stylesheet'
      routingLink.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css'
      document.head.appendChild(routingLink)
    }

    // Load Leaflet Routing Machine JS
    if (!(L as any).Routing) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // Fix default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    // Tạo custom icons
    const originIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    const gpgIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    const selectedGpgIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    return { originIcon, gpgIcon, selectedGpgIcon }
  }
  return null
}

type IconSet = {
  originIcon: L.Icon
  gpgIcon: L.Icon
  selectedGpgIcon: L.Icon
}

interface OriginalOrder {
  id: string
  container_number: string
  depot_id: string
  depot?: {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
  }
}

interface GpgDepot {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

interface CodMapProps {
  originalOrder: OriginalOrder
  gpgDepots: GpgDepot[]
  selectedDepotId: string | null
  hoveredDepotId: string | null
  onDepotSelect: (depotId: string) => void
}

// MapController component để xử lý logic bản đồ
function MapController({ 
  originalOrder, 
  gpgDepots, 
  selectedDepotId, 
  hoveredDepotId,
  onMapReady 
}: {
  originalOrder: OriginalOrder
  gpgDepots: GpgDepot[]
  selectedDepotId: string | null
  hoveredDepotId: string | null
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMap()
  const [isInitialized, setIsInitialized] = useState(false)
  const routingControlRef = useRef<any>(null)

  // Gọi callback khi map sẵn sàng
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  // Fit bounds cho tất cả markers
  useEffect(() => {
    if (isInitialized || !originalOrder.depot) return

    // Kiểm tra tính hợp lệ của coordinates depot gốc
    if (!originalOrder.depot.latitude || !originalOrder.depot.longitude ||
        isNaN(originalOrder.depot.latitude) || isNaN(originalOrder.depot.longitude)) {
      return
    }

    const bounds = L.latLngBounds([])
    
    // Thêm depot gốc
    bounds.extend([originalOrder.depot.latitude, originalOrder.depot.longitude])
    
    // Thêm tất cả depot GPG với kiểm tra coordinates hợp lệ
    gpgDepots.forEach(depot => {
      if (depot.latitude && depot.longitude && 
          !isNaN(depot.latitude) && !isNaN(depot.longitude)) {
        bounds.extend([depot.latitude, depot.longitude])
      }
    })

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
      setIsInitialized(true)
    }
  }, [map, originalOrder.depot, gpgDepots, isInitialized])

  // Xử lý routing khi depot được chọn
  useEffect(() => {
    // Kiểm tra nếu đang ở client side và routing machine đã được load
    if (typeof window === 'undefined' || !(L as any).Routing) return
    
    // Xóa routing cũ
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current)
        routingControlRef.current = null
      } catch (error) {
        console.warn('Lỗi khi xóa routing cũ:', error)
      }
    }

    // Tạo routing mới nếu có depot được chọn
    if (selectedDepotId && originalOrder.depot) {
      const selectedDepot = gpgDepots.find(depot => depot.id === selectedDepotId)
      
      // Kiểm tra tính hợp lệ của coordinates cho cả depot gốc và depot được chọn
      if (selectedDepot && 
          selectedDepot.latitude && selectedDepot.longitude &&
          !isNaN(selectedDepot.latitude) && !isNaN(selectedDepot.longitude) &&
          originalOrder.depot.latitude && originalOrder.depot.longitude &&
          !isNaN(originalOrder.depot.latitude) && !isNaN(originalOrder.depot.longitude)) {
        
        try {
          const routingControl = (L as any).Routing.control({
            waypoints: [
              L.latLng(originalOrder.depot.latitude, originalOrder.depot.longitude),
              L.latLng(selectedDepot.latitude, selectedDepot.longitude)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: () => null, // Không tạo marker mặc định
            lineOptions: {
              styles: [{
                color: '#3b82f6',
                weight: 4,
                opacity: 0.8
              }]
            },
            show: false, // Ẩn hướng dẫn text
            router: (L as any).Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            })
          })
          
          routingControl.addTo(map)
          routingControlRef.current = routingControl
          
        } catch (error) {
          console.warn('Lỗi khi tạo routing:', error)
        }
      }
    }

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current)
          routingControlRef.current = null
        } catch (error) {
          console.warn('Lỗi khi xóa routing:', error)
        }
      }
    }
  }, [map, selectedDepotId, originalOrder.depot, gpgDepots])

  // Xử lý hover effect cho depot markers
  useEffect(() => {
    if (!hoveredDepotId) return
    
    const hoveredDepot = gpgDepots.find(depot => depot.id === hoveredDepotId)
    if (hoveredDepot && 
        hoveredDepot.latitude && hoveredDepot.longitude &&
        !isNaN(hoveredDepot.latitude) && !isNaN(hoveredDepot.longitude)) {
      // Pan đến depot được hover
      map.panTo([hoveredDepot.latitude, hoveredDepot.longitude], {
        animate: true,
        duration: 0.5
      })
    }
  }, [map, hoveredDepotId, gpgDepots])

  return null
}

export default function CodMap({
  originalOrder,
  gpgDepots,
  selectedDepotId,
  hoveredDepotId,
  onDepotSelect
}: CodMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [icons, setIcons] = useState<IconSet | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [isRoutingMachineLoaded, setIsRoutingMachineLoaded] = useState(false)
  const [mapKey, setMapKey] = useState(() => Date.now()) // Unique key để tránh conflict
  const mapInstanceRef = useRef<L.Map | null>(null)
  
  // Load Leaflet assets khi component mount
  useEffect(() => {
    loadLeafletAssets()
      .then(() => {
        setAssetsLoaded(true)
        // Kiểm tra xem routing machine có sẵn không
        if (typeof window !== 'undefined' && (L as any).Routing) {
          setIsRoutingMachineLoaded(true)
        }
      })
      .catch(error => {
        console.error('Lỗi khi load Leaflet assets:', error)
      })
  }, [])

  // Tạo icons sau khi assets được load
  useEffect(() => {
    if (assetsLoaded && !icons) {
      const iconSet = {
        originIcon: new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }),
        gpgIcon: new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }),
        selectedGpgIcon: new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }
      setIcons(iconSet)
    }
  }, [assetsLoaded, icons])

  // Set client-side flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Callback khi map sẵn sàng
  const handleMapReady = (map: L.Map) => {
    mapInstanceRef.current = map
  }

  // Kiểm tra depot gốc
  if (!originalOrder.depot) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Không thể tải thông tin depot gốc</p>
        </div>
      </div>
    )
  }

  // Kiểm tra tính hợp lệ của coordinates depot gốc
  if (!originalOrder.depot.latitude || !originalOrder.depot.longitude ||
      isNaN(originalOrder.depot.latitude) || isNaN(originalOrder.depot.longitude)) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Depot gốc có coordinates không hợp lệ</p>
        </div>
      </div>
    )
  }
  
  // Loading state cho client-side rendering
  if (!isClient || !assetsLoaded || !icons) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Đang tải bản đồ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[500px] relative">
      <MapContainer
        key={mapKey}
        center={[originalOrder.depot.latitude, originalOrder.depot.longitude]}
        zoom={10}
        className="w-full h-full"
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marker cho depot gốc */}
        <Marker 
          position={[originalOrder.depot.latitude, originalOrder.depot.longitude]}
          icon={icons.originIcon}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold text-red-600">Depot Gốc</h3>
              <p><strong>Tên:</strong> {originalOrder.depot.name}</p>
              <p><strong>Địa chỉ:</strong> {originalOrder.depot.address}</p>
              <p><strong>Container:</strong> {originalOrder.container_number}</p>
            </div>
          </Popup>
        </Marker>

        {/* Markers cho các depot GPG */}
        {gpgDepots.map(depot => {
          // Kiểm tra tính hợp lệ của coordinates
          if (!depot.latitude || !depot.longitude || 
              isNaN(depot.latitude) || isNaN(depot.longitude)) {
            return null
          }

          const isSelected = selectedDepotId === depot.id
          const icon = isSelected ? icons.selectedGpgIcon : icons.gpgIcon

          return (
            <Marker 
              key={depot.id}
              position={[depot.latitude, depot.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onDepotSelect(depot.id)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className={`font-semibold ${
                    isSelected ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {isSelected ? 'Depot Được Chọn' : 'Depot GPG'}
                  </h3>
                  <p><strong>Tên:</strong> {depot.name}</p>
                  <p><strong>Địa chỉ:</strong> {depot.address}</p>
                  {!isSelected && (
                    <button 
                      onClick={() => onDepotSelect(depot.id)}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Chọn depot này
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* MapController để xử lý logic */}
        <MapController 
          originalOrder={originalOrder}
          gpgDepots={gpgDepots}
          selectedDepotId={selectedDepotId}
          hoveredDepotId={hoveredDepotId}
          onMapReady={handleMapReady}
        />
      </MapContainer>
    </div>
  )
}