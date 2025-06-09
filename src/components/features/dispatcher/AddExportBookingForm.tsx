'use client'

export default function AddExportBookingForm() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="bookingNumber" className="block text-sm font-medium mb-2">
          Số booking
        </label>
        <input
          type="text"
          id="bookingNumber"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="BK123456789"
        />
      </div>
      
      <div>
        <label htmlFor="requiredType" className="block text-sm font-medium mb-2">
          Loại container yêu cầu
        </label>
        <select
          id="requiredType"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Chọn loại</option>
          <option value="20DC">20ft Dry Container</option>
          <option value="40DC">40ft Dry Container</option>
          <option value="40HC">40ft High Cube</option>
          <option value="45HC">45ft High Cube</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="pickUpLocation" className="block text-sm font-medium mb-2">
          Địa điểm đóng hàng
        </label>
        <input
          type="text"
          id="pickUpLocation"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Nhà máy B, Thủ Đức, TPHCM"
        />
      </div>
      
      <div>
        <label htmlFor="neededBy" className="block text-sm font-medium mb-2">
          Cần container trước
        </label>
        <input
          type="datetime-local"
          id="neededBy"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <button
        type="submit"
        className="w-full btn-primary"
      >
        Thêm Booking
      </button>
    </form>
  )
} 