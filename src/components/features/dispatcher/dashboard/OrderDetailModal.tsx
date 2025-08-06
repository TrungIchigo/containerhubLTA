'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Container, 
  MapPin, 
  Clock, 
  Building2, 
  FileText, 
  CreditCard, 
  Truck, 
  Package, 
  Calendar,
  User,
  Phone,
  Mail,
  DollarSign,
  Leaf,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  ArrowRightLeft,
  RotateCcw,
  Warehouse,
  Globe,
  Shield,
  Info,
  Hash,
  Navigation
} from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainer, ExportBooking, Organization } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  container?: ImportContainer & { shipping_line?: Organization }
  booking?: ExportBooking & { shipping_line?: Organization }
  onRequestCod?: (item: ImportContainer | ExportBooking) => void
  onPayCodFee?: (item: ImportContainer | ExportBooking) => void
  onConfirmCodDelivery?: (item: ImportContainer | ExportBooking) => void
  onConfirmDepotCompletion?: (item: ImportContainer) => void
  onRequestReuse?: (item: ImportContainer | ExportBooking) => void
  onViewDocuments?: (item: ImportContainer | ExportBooking) => void
  onDownloadDocuments?: (item: ImportContainer | ExportBooking) => void
}

export function OrderDetailModal({
  isOpen,
  onClose,
  container,
  booking,
  onRequestCod,
  onPayCodFee,
  onConfirmCodDelivery,
  onConfirmDepotCompletion,
  onRequestReuse,
  onViewDocuments,
  onDownloadDocuments
}: OrderDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [detailData, setDetailData] = useState<{
    containerType?: { code: string; name: string; description?: string }
    cargoType?: { name: string; description?: string; requires_special_handling: boolean }
    depot?: { name: string; address: string; latitude?: number; longitude?: number }
    city?: { name: string; is_major_city: boolean }
    truckingCompany?: { name: string; phone_number?: string; address?: string }
  }>({})

  const item = container || booking
  const isContainer = !!container
  const isBooking = !!booking

  // Fetch detailed information when modal opens
  useEffect(() => {
    if (!isOpen || !item) return

    const fetchDetailData = async () => {
      const supabase = createClient()
      const newDetailData: typeof detailData = {}

      try {
        // Only fetch for containers, not bookings
        if (isContainer && container) {
          // Fetch container type
          if (container.container_type_id) {
            const { data: containerType } = await supabase
              .from('container_types')
              .select('code, name, description')
              .eq('id', container.container_type_id)
              .single()
            if (containerType) newDetailData.containerType = containerType
          }

          // Fetch cargo type
          if (container.cargo_type_id) {
            const { data: cargoType } = await supabase
              .from('cargo_types')
              .select('name, description, requires_special_handling')
              .eq('id', container.cargo_type_id)
              .single()
            if (cargoType) newDetailData.cargoType = cargoType
          }

          // Fetch depot information
          if (container.depot_id) {
            const { data: depot } = await supabase
              .from('depots')
              .select('name, address, latitude, longitude')
              .eq('id', container.depot_id)
              .single()
            if (depot) newDetailData.depot = depot
          }

          // Fetch city information
          if (container.city_id) {
            const { data: city } = await supabase
              .from('cities')
              .select('name, is_major_city')
              .eq('id', container.city_id)
              .single()
            if (city) newDetailData.city = city
          }

          // Fetch trucking company information
          if (container.trucking_company_org_id) {
            const { data: truckingCompany } = await supabase
              .from('organizations')
              .select('name, phone_number, address')
              .eq('id', container.trucking_company_org_id)
              .single()
            if (truckingCompany) newDetailData.truckingCompany = truckingCompany
          }
        }

        setDetailData(newDetailData)
      } catch (error) {
        console.error('Error fetching detail data:', error)
      }
    }

    fetchDetailData()
  }, [isOpen, isContainer, container?.id, container?.container_type_id, container?.cargo_type_id, container?.depot_id, container?.city_id, container?.trucking_company_org_id, container?.status])

  // Status mapping cho container với các trạng thái COD mới
  const containerStatusMap = {
    'AVAILABLE': { text: 'Sẵn sàng', variant: 'approved' as const, color: 'text-green-700', bg: 'bg-green-50' },
    'AWAITING_REUSE_APPROVAL': { text: 'Chờ duyệt Re-use', variant: 'pending' as const, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    'AWAITING_COD_APPROVAL': { text: 'Chờ duyệt COD', variant: 'pending' as const, color: 'text-orange-700', bg: 'bg-orange-50' },
    'AWAITING_COD_PAYMENT': { text: 'Chờ thanh toán phí COD', variant: 'warning' as const, color: 'text-orange-700', bg: 'bg-orange-50' },
    'AWAITING_REUSE_PAYMENT': { text: 'Chờ thanh toán phí Re-use', variant: 'warning' as const, color: 'text-orange-700', bg: 'bg-orange-50' },
    'ON_GOING_COD': { text: 'Đang thực hiện COD', variant: 'info' as const, color: 'text-blue-700', bg: 'bg-blue-50' },
    'ON_GOING_REUSE': { text: 'Đang thực hiện Re-use', variant: 'info' as const, color: 'text-blue-700', bg: 'bg-blue-50' },
    'DEPOT_PROCESSING': { text: 'Đang xử lý tại Depot', variant: 'secondary' as const, color: 'text-purple-700', bg: 'bg-purple-50' },
    'COMPLETED': { text: 'Hoàn tất', variant: 'approved' as const, color: 'text-green-700', bg: 'bg-green-50' },
    'REJECTED_COD': { text: 'Từ chối COD', variant: 'destructive' as const, color: 'text-red-700', bg: 'bg-red-50' },
    'REJECTED_REUSE': { text: 'Từ chối Re-use', variant: 'destructive' as const, color: 'text-red-700', bg: 'bg-red-50' },
    // Các trạng thái COD mới theo yêu cầu Việt Nam
    'PENDING': { text: 'Chờ duyệt', variant: 'pending' as const, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    'APPROVED': { text: 'Đã duyệt', variant: 'approved' as const, color: 'text-green-700', bg: 'bg-green-50' },
    'DECLINED': { text: 'Từ chối', variant: 'destructive' as const, color: 'text-red-700', bg: 'bg-red-50' },
    'AWAITING_INFO': { text: 'Chờ thông tin', variant: 'outline' as const, color: 'text-gray-700', bg: 'bg-gray-50' },
    'EXPIRED': { text: 'Hết hạn', variant: 'destructive' as const, color: 'text-red-700', bg: 'bg-red-50' },
    'REVERSED': { text: 'Đã hoàn', variant: 'secondary' as const, color: 'text-purple-700', bg: 'bg-purple-50' },
    'PENDING_PAYMENT': { text: 'Chờ thanh toán', variant: 'warning' as const, color: 'text-orange-700', bg: 'bg-orange-50' },
    'PAID': { text: 'Đã thanh toán', variant: 'approved' as const, color: 'text-green-700', bg: 'bg-green-50' },
    'PROCESSING_AT_DEPOT': { text: 'Xử lý tại depot', variant: 'info' as const, color: 'text-blue-700', bg: 'bg-blue-50' },
    'CANCELLED': { text: 'Đã hủy', variant: 'destructive' as const, color: 'text-red-700', bg: 'bg-red-50' }
  }

  // Status mapping cho booking
  const bookingStatusMap = {
    'AVAILABLE': { text: 'Sẵn sàng', variant: 'approved' as const, color: 'text-green-700', bg: 'bg-green-50' },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt', variant: 'pending' as const, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    'CONFIRMED': { text: 'Đã ghép', variant: 'info' as const, color: 'text-blue-700', bg: 'bg-blue-50' }
  }

  const statusInfo = item ? (isContainer 
    ? containerStatusMap[item.status as keyof typeof containerStatusMap] || containerStatusMap.AVAILABLE
    : bookingStatusMap[item.status as keyof typeof bookingStatusMap] || bookingStatusMap.AVAILABLE) : containerStatusMap.AVAILABLE

  // Lấy các hành động có thể thực hiện dựa trên trạng thái
  const getAvailableActions = () => {
    const actions: any[] = []

    if (!item) return actions

    if (isContainer) {
      const containerItem = item as ImportContainer
      
      switch (containerItem.status) {
        case 'AVAILABLE':
          actions.push(
            { id: 'request-cod', label: 'Yêu cầu COD', icon: CreditCard, variant: 'default' as const, onClick: () => onRequestCod?.(containerItem) },
            { id: 'request-reuse', label: 'Yêu cầu Re-use', icon: RotateCcw, variant: 'outline' as const, onClick: () => onRequestReuse?.(containerItem) }
          )
          break
        case 'AWAITING_COD_PAYMENT':
          actions.push(
            { id: 'pay-cod', label: 'Thanh toán COD', icon: DollarSign, variant: 'default' as const, onClick: () => onPayCodFee?.(containerItem) }
          )
          break
        case 'ON_GOING_COD':
          actions.push(
            { id: 'confirm-delivery', label: 'Xác nhận giao hàng', icon: CheckCircle, variant: 'default' as const, onClick: () => onConfirmCodDelivery?.(containerItem) }
          )
          break
        case 'DEPOT_PROCESSING':
          actions.push(
            { id: 'confirm-completion', label: 'Xác nhận hoàn thành', icon: CheckCircle, variant: 'default' as const, onClick: () => onConfirmDepotCompletion?.(containerItem) }
          )
          break
        case 'COD_REJECTED':
          actions.push(
            { id: 'request-cod-again', label: 'Yêu cầu COD lại', icon: CreditCard, variant: 'outline' as const, onClick: () => onRequestCod?.(containerItem) }
          )
          break
        case 'REUSE_REJECTED':
          actions.push(
            { id: 'request-reuse-again', label: 'Yêu cầu Re-use lại', icon: RotateCcw, variant: 'outline' as const, onClick: () => onRequestReuse?.(containerItem) }
          )
          break
        case 'AWAITING_COD_APPROVAL':
        case 'AWAITING_REUSE_APPROVAL':
          break
        case 'COMPLETED':
        case 'EXPIRED':
          break
      }
    } else if (isBooking) {
      const bookingItem = item as ExportBooking
      
      switch (bookingItem.status) {
        case 'AVAILABLE':
          actions.push(
            { id: 'request-reuse', label: 'Yêu cầu Re-use', icon: RotateCcw, variant: 'default' as const, onClick: () => onRequestReuse?.(bookingItem) }
          )
          break
      }
    }

    // Hành động chung
    if (item && item.attached_documents && item.attached_documents.length > 0) {
      actions.push(
        { id: 'view-docs', label: 'Xem tài liệu', icon: Eye, variant: 'outline' as const, onClick: () => onViewDocuments?.(item) },
        { id: 'download-docs', label: 'Tải tài liệu', icon: Download, variant: 'outline' as const, onClick: () => onDownloadDocuments?.(item) }
      )
    }

    return actions
  }

  const availableActions = getAvailableActions()

  if (!isOpen || !item) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-gray-50 to-white">
        {/* Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {isContainer ? 'Chi tiết Container' : 'Chi tiết Booking'} - {isContainer ? (container as ImportContainer).container_number : (booking as ExportBooking).booking_number}
        </DialogTitle>
        
        {/* Header với gradient background */}
        <div className={`relative p-6 ${isContainer ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-orange-600 to-orange-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                {isContainer ? <Container className="w-6 h-6 text-white" /> : <Truck className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isContainer ? (container as ImportContainer).container_number : (booking as ExportBooking).booking_number}
                </h2>
                <p className="text-blue-100 font-medium">
                  {isContainer ? 'Chi tiết Container' : 'Chi tiết Booking'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm font-medium">Tạo lúc</div>
              <div className="text-white font-semibold">{formatStoredDateTimeVN(item.created_at)}</div>
            </div>
          </div>
          
          {/* Status badge floating */}
          <div className="absolute -bottom-4 left-6">
            <Badge variant={statusInfo.variant} className="text-sm px-4 py-2 shadow-lg">
              {statusInfo.text}
            </Badge>
          </div>
        </div>

        {/* Content với scroll */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="space-y-6">
            {/* Thông tin cơ bản - Card chính */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cột trái - Thông tin chính */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-700 mb-1">Loại Container</div>
                        <div className="text-lg font-bold text-gray-900">
                          {detailData.containerType ? 
                            `${detailData.containerType.code} - ${detailData.containerType.name}` : 
                            (isContainer ? (container as ImportContainer).container_type : (booking as ExportBooking).required_container_type)
                          }
                        </div>
                        {detailData.containerType?.description && (
                          <div className="text-sm text-blue-600 mt-2">
                            {detailData.containerType.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-purple-700 mb-1">Hãng Tàu</div>
                        <div className="text-lg font-bold text-gray-900">
                          {item.shipping_line?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cột phải - Địa điểm và thời gian */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-700 mb-1">
                          {isContainer ? 'Địa điểm dỡ hàng' : 'Địa điểm lấy hàng'}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {isContainer ? (container as ImportContainer).drop_off_location : (booking as ExportBooking).pick_up_location}
                        </div>
                        {detailData.city && (
                          <div className="flex items-center gap-2 mt-2">
                            <Globe className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">{detailData.city.name}</span>
                            {detailData.city.is_major_city && (
                              <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-200 text-green-800">Thành phố lớn</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-orange-700 mb-1">
                          {isContainer ? 'Sẵn sàng từ' : 'Cần trước'}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatStoredDateTimeVN(
                            isContainer ? (container as ImportContainer).available_from_datetime : (booking as ExportBooking).needed_by_datetime
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thông tin bổ sung */}
            {(detailData.cargoType || detailData.depot || detailData.truckingCompany) && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Thông tin bổ sung
                  </h3>
                  
                  <div className="space-y-4">
                    {detailData.cargoType && (
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-indigo-700 mb-1">Loại Hàng Hóa</div>
                          <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {detailData.cargoType.name}
                            {detailData.cargoType.requires_special_handling && (
                              <Badge variant="warning" className="text-xs bg-yellow-100 text-yellow-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Xử lý đặc biệt
                              </Badge>
                            )}
                          </div>
                          {detailData.cargoType.description && (
                            <div className="text-sm text-indigo-600 mt-2">
                              {detailData.cargoType.description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {detailData.depot && (
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl">
                        <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Warehouse className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-teal-700 mb-1">Depot</div>
                          <div className="text-lg font-bold text-gray-900">
                            {detailData.depot.name}
                          </div>
                          <div className="text-sm text-teal-600 mt-2">
                            {detailData.depot.address}
                          </div>
                          {detailData.depot.latitude && detailData.depot.longitude && (
                            <div className="flex items-center gap-2 mt-2">
                              <Navigation className="w-4 h-4 text-teal-600" />
                              <span className="text-sm text-teal-700 font-medium">
                                {detailData.depot.latitude.toFixed(4)}, {detailData.depot.longitude.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {detailData.truckingCompany && (
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-amber-700 mb-1">Công ty Vận tải</div>
                          <div className="text-lg font-bold text-gray-900">
                            {detailData.truckingCompany.name}
                          </div>
                          {detailData.truckingCompany.phone_number && (
                            <div className="flex items-center gap-2 mt-2">
                              <Phone className="w-4 h-4 text-amber-600" />
                              <span className="text-sm text-amber-700 font-medium">
                                {detailData.truckingCompany.phone_number}
                              </span>
                            </div>
                          )}
                          {detailData.truckingCompany.address && (
                            <div className="text-sm text-amber-600 mt-2">
                              {detailData.truckingCompany.address}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thông tin kỹ thuật */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-gray-600" />
                  Thông tin kỹ thuật
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">ID</div>
                      <div className="font-mono text-sm font-bold text-gray-900">
                        {item.id.slice(0, 8)}...
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                      <div className="text-sm font-bold text-gray-900">
                        {item.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Ngày tạo</div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatStoredDateTimeVN(item.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hành động có thể thực hiện */}
            {availableActions.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                    Hành động có thể thực hiện
                  </h3>
                  
                  <div className="flex flex-wrap gap-3">
                    {availableActions.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.variant}
                        size="lg"
                        onClick={action.onClick}
                        disabled={isLoading}
                        className="shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <action.icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thông tin liên hệ */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Thông tin liên hệ
                </h3>
                
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Thông tin liên hệ sẽ được hiển thị khi có dữ liệu từ hệ thống
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ghi chú quan trọng */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Lưu ý</h3>
                    <p className="text-gray-700">
                      Vui lòng kiểm tra kỹ thông tin trước khi thực hiện các hành động. 
                      Đảm bảo rằng tất cả thông tin đều chính xác và cập nhật.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}