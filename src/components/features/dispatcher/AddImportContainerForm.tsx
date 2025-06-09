'use client'

export default function AddImportContainerForm() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="containerNumber" className="block text-sm font-medium mb-2">
          Số container
        </label>
        <input
          type="text"
          id="containerNumber"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="MSKU1234567"
        />
      </div>
      
      <div>
        <label htmlFor="containerType" className="block text-sm font-medium mb-2">
          Loại container
        </label>
        <select
          id="containerType"
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
        <label htmlFor="dropOffLocation" className="block text-sm font-medium mb-2">
          Địa điểm dỡ hàng
        </label>
        <input
          type="text"
          id="dropOffLocation"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Kho A, Quận 9, TPHCM"
        />
      </div>
      
      <div>
        <label htmlFor="availableFrom" className="block text-sm font-medium mb-2">
          Thời gian rảnh
        </label>
        <input
          type="datetime-local"
          id="availableFrom"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <button
        type="submit"
        className="w-full btn-primary"
      >
        Thêm Container
      </button>
    </form>
  )
} 