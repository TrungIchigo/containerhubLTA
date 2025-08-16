'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, MapPin, Eye, CreditCard, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CodRequestDialog from '@/components/features/cod/CodRequestDialog'
import ContainerDetailDialog from './ContainerDetailDialog'
import type { Organization } from '@/lib/types'
import type { ImportContainer } from '@/lib/types/container'
// Định nghĩa enum asset_status đúng chuẩn Supabase
export type AssetStatus =
  | 'AVAILABLE'
  | 'AWAITING_APPROVAL'
  | 'CONFIRMED'
  | 'AWAITING_REUSE_APPROVAL'
  | 'COD_REJECTED'
  | 'AWAITING_COD_APPROVAL'
  | 'AWAITING_COD_PAYMENT'
  | 'AWAITING_REUSE_PAYMENT'
  | 'ON_GOING_COD'
  | 'ON_GOING_REUSE'
  | 'DEPOT_PROCESSING'
  | 'COMPLETED'
  | 'REUSE_REJECTED'
  | 'PAYMENT_CANCELLED';
import { useState } from 'react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { confirmCodCompletion } from '@/lib/actions/cod'
import { useRouter } from 'next/navigation'
import { CodPaymentDialog } from '@/components/features/cod/CodPaymentDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ImportContainersTableProps {
  containers: (ImportContainer & {
    shipping_line?: Organization
  })[]
  shippingLines: Organization[]
}

export default function ImportContainersTable({ 
  containers, 
  shippingLines 
}: ImportContainersTableProps) {
  const [selectedContainer, setSelectedContainer] = useState<ImportContainer | null>(null)
  const [isCodDialogOpen, setIsCodDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [codPaymentDialogOpen, setCodPaymentDialogOpen] = useState(false)
  const [codPaymentData, setCodPaymentData] = useState<import('@/lib/types/billing').PendingCodPayment | null>(null)
  const [codPaymentLoading, setCodPaymentLoading] = useState(false)
  const [codCompleteDialogOpen, setCodCompleteDialogOpen] = useState(false);
  const [codCompleteLoading, setCodCompleteLoading] = useState(false);
  const [codCompleteContainer, setCodCompleteContainer] = useState<ImportContainer | null>(null);
  const [depotCompleteDialogOpen, setDepotCompleteDialogOpen] = useState(false);
  const [depotCompleteLoading, setDepotCompleteLoading] = useState(false);
  const [depotCompleteContainer, setDepotCompleteContainer] = useState<ImportContainer | null>(null);

  // Sử dụng type AssetStatus chuẩn
  const statusMap: Record<AssetStatus, { text: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    AVAILABLE: { text: 'Lệnh mới tạo', variant: 'new-order' },
    AWAITING_APPROVAL: { text: 'Chờ duyệt', variant: 'pending-reuse' },
    CONFIRMED: { text: 'Đã xác nhận', variant: 'processing-reuse' },
    AWAITING_REUSE_APPROVAL: { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' },
    COD_REJECTED: { text: 'Bị từ chối COD', variant: 'declined-cod' },
    AWAITING_COD_APPROVAL: { text: 'Chờ duyệt COD', variant: 'pending-cod' },
    AWAITING_COD_PAYMENT: { text: 'Chờ thanh toán phí COD', variant: 'pending-cod-payment' },
    AWAITING_REUSE_PAYMENT: { text: 'Chờ thanh toán phí Re-use', variant: 'pending-reuse-payment' },
    ON_GOING_COD: { text: 'Đang thực hiện COD', variant: 'processing-cod' },
    ON_GOING_REUSE: { text: 'Đang thực hiện Re-use', variant: 'processing-reuse' },
    DEPOT_PROCESSING: { text: 'Đang xử lý tại Depot', variant: 'processing-depot' },
    COMPLETED: { text: 'Hoàn tất', variant: 'completed' },
    REUSE_REJECTED: { text: 'Bị từ chối Re-use', variant: 'declined-reuse' },
    PAYMENT_CANCELLED: { text: 'Đã hủy thanh toán', variant: 'outline' },
  };

  const getStatusBadge = (status: AssetStatus) => {
    const currentStatus = statusMap[status] || { text: status, variant: 'outline' as const };
    return <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>;
  }

  const handleCodRequest = (container: ImportContainer) => {
    setSelectedContainer(container)
    setIsCodDialogOpen(true)
  }

  const handleViewDetails = (container: ImportContainer) => {
    setSelectedContainer(container)
    setIsDetailDialogOpen(true)
  }

  const handlePayCodFee = async (container: ImportContainer) => {
    setCodPaymentLoading(true)
    try {
      const response = await fetch('/api/cod/container-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId: container.id })
      })
      const result = await response.json()
      // Nếu container.status là 'AWAITING_COD_PAYMENT', lấy COD request mới nhất có cod_fee > 0
      let codRequest: any = null;
      if (container.status === 'AWAITING_COD_PAYMENT') {
        codRequest = (result.data || []).find((r: any) => r.cod_fee > 0)
      } else {
        codRequest = (result.data || []).find((r: any) => r.status === 'AWAITING_COD_PAYMENT' && r.cod_fee > 0)
      }
      if (!codRequest) {
        console.error('Tất cả COD requests trả về cho container:', result.data)
        if ((result.data || []).length > 0) {
          toast({ title: "Không tìm thấy phí COD cần thanh toán phù hợp. Vui lòng liên hệ admin để kiểm tra lại trạng thái trên hệ thống.", variant: "destructive" })
        } else {
          toast({ title: "Không tìm thấy yêu cầu COD nào cho container này.", variant: "destructive" })
        }
        return
      }
      setCodPaymentData({
        id: codRequest.id,
        status: codRequest.status,
        cod_fee: codRequest.cod_fee,
        delivery_confirmed_at: codRequest.delivery_confirmed_at || codRequest.created_at,
        container_number: codRequest.import_container?.container_number || container.container_number,
        requesting_org_name: '', // Có thể lấy từ context nếu cần
        original_depot_address: codRequest.original_depot_address || 'N/A',
        requested_depot_name: codRequest.requested_depot_name || 'N/A',
        created_at: codRequest.created_at
      })
      setCodPaymentDialogOpen(true)
    } catch (error) {
      toast({ title: "Lỗi khi lấy thông tin COD", description: String(error), variant: "destructive" })
    } finally {
      setCodPaymentLoading(false)
    }
  }

  const handleConfirmCodCompletion = async (container: ImportContainer) => {
    if (isLoading) return
    
    try {
      setIsLoading(true)
      
      // Find COD request for this container
      const response = await fetch('/api/cod/container-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          containerId: container.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Không thể tìm thấy yêu cầu COD cho container này')
      }
      
      const result = await response.json()
      const codRequest = result.data?.[0]
      
      if (!codRequest) {
        throw new Error('Không tìm thấy yêu cầu COD liên quan')
      }
      
      // Confirm COD completion
      const confirmResult = await confirmCodCompletion(codRequest.id)
      
      if (confirmResult.success) {
        toast({
          title: "✅ Thành công",
          description: confirmResult.message,
          variant: "success"
        })
        
        // Refresh page to update container status
        window.location.reload()
      } else {
        throw new Error(confirmResult.message)
      }
      
    } catch (error: any) {
      console.error('Error confirming COD completion:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi xác nhận hoàn tất COD',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="card mb-8">               
        <CardContent>
          {containers.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="text-body">Chưa có lệnh giao trả nào.</p>
              <p className="text-body-small mt-2">Hãy thêm lệnh đầu tiên để bắt đầu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-text-primary">Số Container</th>
                    <th className="text-left p-3 font-medium text-text-primary">Loại</th>
                    <th className="text-left p-3 font-medium text-text-primary">Hãng Tàu</th>
                    <th className="text-left p-3 font-medium text-text-primary">Địa Điểm Dỡ Hàng</th>
                    <th className="text-left p-3 font-medium text-text-primary">Thời Gian Rảnh</th>
                    <th className="text-center p-3 font-medium text-text-primary w-32">Trạng Thái</th>
                    <th className="text-center p-3 font-medium text-text-primary w-24">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((container) => (
                    <tr key={container.id} className="border-b border-border hover:bg-gray-50">
                      <td 
                        className="p-3 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleViewDetails(container)}
                      >
                        <div className="font-medium text-text-primary hover:text-blue-600">
                          {container.container_number}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {container.container_type || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-3 text-text-secondary">
                        {container.shipping_line?.name || 'N/A'}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {container.drop_off_location}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {formatStoredDateTimeVN(container.available_from_datetime)}
                      </td>
                      <td className="p-3 text-center w-32">
                        <div className="whitespace-nowrap">
                          {getStatusBadge(container.status as AssetStatus)}
                        </div>
                      </td>
                      <td className="p-3 text-center w-24">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(container)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Xem Chi Tiết
                            </DropdownMenuItem>
                            {container.status === 'AVAILABLE' && (
                              <DropdownMenuItem
                                onClick={() => handleCodRequest(container)}
                                className="cursor-pointer"
                              >
                                <MapPin className="mr-2 h-4 w-4" />
                                Yêu cầu Đổi Nơi Trả
                              </DropdownMenuItem>
                            )}
                            {container.status === 'AWAITING_COD_PAYMENT' && (
                              <DropdownMenuItem
                                onClick={codPaymentLoading ? undefined : () => handlePayCodFee(container)}
                                className={`cursor-pointer text-orange-600 ${codPaymentLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Thanh toán phí COD
                              </DropdownMenuItem>
                            )}
                            {container.status === 'ON_GOING_COD' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setCodCompleteContainer(container);
                                  setCodCompleteDialogOpen(true);
                                }}
                                className={`cursor-pointer text-blue-600`}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Xác nhận hoàn tất COD
                              </DropdownMenuItem>
                            )}
                            {container.status === 'DEPOT_PROCESSING' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setDepotCompleteContainer(container);
                                  setDepotCompleteDialogOpen(true);
                                }}
                                className={`cursor-pointer text-green-600`}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Xác nhận hoàn tất xử lý tại depot
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* COD Request Dialog */}
      {selectedContainer && (
        <CodRequestDialog
          isOpen={isCodDialogOpen}
          onClose={() => {
            setIsCodDialogOpen(false)
            setSelectedContainer(null)
          }}
          container={selectedContainer}
        />
      )}

      {/* Container Detail Dialog */}
      {selectedContainer && (
        <ContainerDetailDialog
          container={selectedContainer}
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false)
            setSelectedContainer(null)
            setSelectedContainer(null)
            // The parent component would need to handle refresh
          }}
        />
      )}
      <CodPaymentDialog
        open={codPaymentDialogOpen}
        onOpenChange={(open) => {
          setCodPaymentDialogOpen(open)
          if (!open) setCodPaymentData(null)
        }}
        payment={codPaymentData}
        onPaymentSuccess={() => {
          setCodPaymentDialogOpen(false)
          setCodPaymentData(null)
          router.refresh?.()
        }}
      />
      {/* Dialog xác nhận hoàn tất COD */}
      {codCompleteContainer && (
        <Dialog open={codCompleteDialogOpen} onOpenChange={setCodCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận hoàn tất COD</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              Bạn có chắc chắn muốn xác nhận hoàn tất COD cho container <b>{codCompleteContainer.container_number}</b> không?
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCodCompleteDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={async () => {
                  setCodCompleteLoading(true);
                  try {
                    const res = await fetch('/api/cod/carrier-requests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'confirm_cod_complete', containerId: codCompleteContainer.id })
                    });
                    const result = await res.json();
                    if (result.success) {
                      toast({ title: 'Thành công', description: 'Đã xác nhận hoàn tất COD!', variant: 'success' });
                      setCodCompleteDialogOpen(false);
                      setCodCompleteContainer(null);
                      router.refresh?.();
                    } else {
                      toast({ title: 'Lỗi', description: result.message || 'Không thể xác nhận hoàn tất COD', variant: 'destructive' });
                    }
                  } catch (err) {
                    toast({ title: 'Lỗi', description: String(err), variant: 'destructive' });
                  } finally {
                    setCodCompleteLoading(false);
                  }
                }}
                disabled={codCompleteLoading}
              >
                {codCompleteLoading ? 'Đang xác nhận...' : 'Xác nhận'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Dialog xác nhận hoàn tất xử lý tại depot */}
      {depotCompleteContainer && (
        <Dialog open={depotCompleteDialogOpen} onOpenChange={setDepotCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận hoàn tất xử lý tại depot</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              Bạn có chắc chắn muốn xác nhận hoàn tất xử lý tại depot cho container <b>{depotCompleteContainer.container_number}</b> không?
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDepotCompleteDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={async () => {
                  setDepotCompleteLoading(true);
                  try {
                    const res = await fetch('/api/cod/carrier-requests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'complete_cod_process', containerId: depotCompleteContainer.id })
                    });
                    const result = await res.json();
                    if (result.success) {
                      toast({ title: 'Thành công', description: 'Đã xác nhận hoàn tất xử lý tại depot!', variant: 'success' });
                      setDepotCompleteDialogOpen(false);
                      setDepotCompleteContainer(null);
                      router.refresh?.();
                    } else {
                      toast({ title: 'Lỗi', description: result.message || 'Không thể xác nhận hoàn tất depot', variant: 'destructive' });
                    }
                  } catch (err) {
                    toast({ title: 'Lỗi', description: String(err), variant: 'destructive' });
                  } finally {
                    setDepotCompleteLoading(false);
                  }
                }}
                disabled={depotCompleteLoading}
              >
                {depotCompleteLoading ? 'Đang xác nhận...' : 'Xác nhận'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}