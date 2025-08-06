'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OrderDetailModal } from '@/components/features/dispatcher/dashboard/OrderDetailModal'

// Mock data cho container
const mockContainer = {
  id: 'test-container-1',
  container_number: 'ABCD1234567',
  container_type: '40HC',
  container_type_id: '1',
  cargo_type_id: '1',
  depot_id: '1',
  city_id: '1',
  trucking_company_org_id: '1',
  status: 'AVAILABLE',
  drop_off_location: 'Cảng Hải Phòng',
  available_from_datetime: '2024-01-15T10:00:00Z',
  created_at: '2024-01-10T08:00:00Z',
  shipping_line: {
    name: 'MSC'
  }
}

// Mock data cho booking
const mockBooking = {
  id: 'test-booking-1',
  booking_number: 'BK001234',
  required_container_type: '40HC',
  status: 'AVAILABLE',
  pick_up_location: 'Cảng Hải Phòng',
  needed_by_datetime: '2024-01-20T10:00:00Z',
  created_at: '2024-01-10T08:00:00Z',
  shipping_line: {
    name: 'MSC'
  }
}

export default function TestModalPage() {
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const handleOpenContainerModal = () => {
    console.log('Opening container modal:', mockContainer)
    setIsContainerModalOpen(true)
  }

  const handleOpenBookingModal = () => {
    console.log('Opening booking modal:', mockBooking)
    setIsBookingModalOpen(true)
  }

  const handleCloseContainerModal = () => {
    console.log('Closing container modal')
    setIsContainerModalOpen(false)
  }

  const handleCloseBookingModal = () => {
    console.log('Closing booking modal')
    setIsBookingModalOpen(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test OrderDetailModal Functionality</h1>
      
      <div className="space-y-6">
        {/* Container Test */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Container Modal Test:</h2>
          <p><strong>Number:</strong> {mockContainer.container_number}</p>
          <p><strong>Type:</strong> {mockContainer.container_type}</p>
          <p><strong>Status:</strong> {mockContainer.status}</p>
          <p><strong>Location:</strong> {mockContainer.drop_off_location}</p>
          
          <Button 
            onClick={handleOpenContainerModal} 
            className="mt-3 bg-blue-600 hover:bg-blue-700"
          >
            Xem Chi Tiết Container
          </Button>
          
          {isContainerModalOpen && (
            <div className="mt-2 p-2 bg-green-100 rounded">
              <p>✅ Container Modal đã được mở!</p>
            </div>
          )}
        </div>

        {/* Booking Test */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Booking Modal Test:</h2>
          <p><strong>Number:</strong> {mockBooking.booking_number}</p>
          <p><strong>Type:</strong> {mockBooking.required_container_type}</p>
          <p><strong>Status:</strong> {mockBooking.status}</p>
          <p><strong>Location:</strong> {mockBooking.pick_up_location}</p>
          
          <Button 
            onClick={handleOpenBookingModal} 
            className="mt-3 bg-orange-600 hover:bg-orange-700"
          >
            Xem Chi Tiết Booking
          </Button>
          
          {isBookingModalOpen && (
            <div className="mt-2 p-2 bg-green-100 rounded">
              <p>✅ Booking Modal đã được mở!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Container Detail Modal */}
      <OrderDetailModal
        isOpen={isContainerModalOpen}
        onClose={handleCloseContainerModal}
        container={mockContainer as any}
      />

      {/* Booking Detail Modal */}
      <OrderDetailModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        booking={mockBooking as any}
      />
    </div>
  )
}