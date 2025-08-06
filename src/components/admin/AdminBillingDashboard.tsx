'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { 
  CalendarIcon, 
  DollarSign, 
  Receipt, 
  FileText, 
  CheckCircle, 
  Building2,
  Loader2,
  TrendingUp,
  Package
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getUnpaidTransactions,
  getInvoices,
  getBillingStats,
  getOrganizationBillingSummary,
  createInvoiceForOrganization,
  markInvoiceAsPaid
} from '@/lib/actions/billing'
import { confirmCodPayment, startDepotProcessing, completeCodProcess } from '@/lib/actions/cod'
import type { 
  Transaction, 
  Invoice, 
  BillingStats, 
  OrganizationBillingSummary 
} from '@/lib/types/billing'
import { Loading } from '@/components/ui/loader'

// Add new interface for COD requests
interface CodPaymentRequest {
  id: string
  container_number: string
  requesting_org_name: string
  cod_fee: number
  status: string
  delivery_confirmed_at: string
}

export function AdminBillingDashboard() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [orgSummary, setOrgSummary] = useState<OrganizationBillingSummary[]>([])
  const [codPaymentRequests, setCodPaymentRequests] = useState<CodPaymentRequest[]>([])

  const [codRelatedInvoices, setCodRelatedInvoices] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [codPaymentDialogOpen, setCodPaymentDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedCodRequest, setSelectedCodRequest] = useState<CodPaymentRequest | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [isProcessingCodPayment, setIsProcessingCodPayment] = useState(false)
  
  // Invoice creation form
  const [periodStart, setPeriodStart] = useState<Date>()
  const [periodEnd, setPeriodEnd] = useState<Date>()

  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadCodPaymentRequests().then(result => {
      if (result.success) {
        setCodPaymentRequests(result.data)
      }
    })

    loadCodRelatedInvoices().then(result => {
      if (result.success) {
        setCodRelatedInvoices(result.data)
      }
    })
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [
        transactionsResult,
        invoicesResult,
        statsResult,
        orgSummaryResult,
        codPaymentResult
      ] = await Promise.all([
        getUnpaidTransactions(),
        getInvoices(),
        getBillingStats(),
        getOrganizationBillingSummary(),
        loadCodPaymentRequests()
      ])

      if (transactionsResult.success) setTransactions(transactionsResult.data!)
      if (invoicesResult.success) setInvoices(invoicesResult.data!)
      if (statsResult.success) setStats(statsResult.data!)
      if (orgSummaryResult.success) setOrgSummary(orgSummaryResult.data!)
      if (codPaymentResult.success) setCodPaymentRequests(codPaymentResult.data!)
    } catch (error) {
      console.error('Error loading billing data:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu tài chính",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCodPaymentRequests = async () => {
    try {
      const response = await fetch('/api/cod/pending-payments')
      const result = await response.json()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error loading COD payment requests:', error)
      return { success: false, error: 'Failed to load COD payment requests' }
    }
  }



  const loadCodRelatedInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/cod-related')
      const result = await response.json()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error loading COD related invoices:', error)
      return { success: false, error: 'Failed to load COD related invoices' }
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedOrg || !periodStart || !periodEnd) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn tổ chức và khoảng thời gian",
        variant: "destructive"
      })
      return
    }

    setIsCreatingInvoice(true)
    try {
      const result = await createInvoiceForOrganization({
        organization_id: selectedOrg,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd')
      })

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo hóa đơn thành công"
        })
        setInvoiceDialogOpen(false)
        loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo hóa đơn",
        variant: "destructive"
      })
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return

    setIsMarkingPaid(true)
    try {
      const result = await markInvoiceAsPaid(selectedInvoice.id)

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã đánh dấu hóa đơn đã thanh toán"
        })
        setPaymentDialogOpen(false)
        loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái thanh toán",
        variant: "destructive"
      })
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const handleConfirmCodPayment = async () => {
    if (!selectedCodRequest) return

    setIsProcessingCodPayment(true)
    try {
      const result = await confirmCodPayment(selectedCodRequest.id)

      if (result.success) {
        toast({
          title: "✅ Thành công",
          description: result.message,
          variant: "default"
        })
        
        setCodPaymentDialogOpen(false)
        setSelectedCodRequest(null)
        loadData() // Refresh data
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error confirming COD payment:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi xác nhận thanh toán',
        variant: "destructive"
      })
    } finally {
      setIsProcessingCodPayment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={getStatusVariant(status)}>
        {getStatusLabel(status)}
      </Badge>
    )
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_INFO':
        return 'outline'
      case 'APPROVED':
      case 'PAID':
      case 'COMPLETED':
        return 'default'
      case 'DECLINED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'destructive'
      case 'PENDING_PAYMENT':
      case 'PROCESSING_AT_DEPOT':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Chờ duyệt'
      case 'APPROVED':
        return 'Đã duyệt'
      case 'DECLINED':
        return 'Từ chối'
      case 'AWAITING_INFO':
        return 'Chờ thông tin'
      case 'EXPIRED':
        return 'Hết hạn'
      case 'REVERSED':
        return 'Đã hoàn'
      case 'PENDING_PAYMENT':
        return 'Chờ thanh toán'
      case 'PAID':
        return 'Đã thanh toán'
      case 'PROCESSING_AT_DEPOT':
        return 'Xử lý tại depot'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VNĐ'
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loading text="Đang tải dữ liệu..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phí COD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(codPaymentRequests.reduce((sum, req) => sum + (req.cod_fee || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Tổng phí COD chờ thanh toán</p>
          </CardContent>
        </Card>
        

        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã Thu</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.paid_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Doanh thu đã thu</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cod-payments">COD Chờ Thanh Toán</TabsTrigger>
          <TabsTrigger value="invoices">Hóa Đơn COD/Reuse</TabsTrigger>
          <TabsTrigger value="summary">Tóm Tắt Tổ Chức</TabsTrigger>
        </TabsList>



        {/* COD/Reuse Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Hóa Đơn COD/Reuse
              </CardTitle>
              <CardDescription>
                Danh sách tất cả các hóa đơn liên quan đến phí COD và phí reuse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {codRelatedInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Chưa có hóa đơn COD/Reuse</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hóa đơn liên quan COD và reuse sẽ xuất hiện ở đây
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số Hóa Đơn</TableHead>
                      <TableHead>Container</TableHead>
                      <TableHead>Loại Phí</TableHead>
                      <TableHead>Công Ty</TableHead>
                      <TableHead>Số Tiền</TableHead>
                      <TableHead>Ngày Tạo</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codRelatedInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">
                          {invoice.invoice_number || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.container_number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.fee_type === 'COD' ? 'default' : 'secondary'}>
                            {invoice.fee_type === 'COD' ? 'Phí COD' : 'Phí Reuse'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            {invoice.company_name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(invoice.amount || 0)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COD Payments Tab */}
        <TabsContent value="cod-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                COD Requests Chờ Thanh Toán
              </CardTitle>
              <CardDescription>
                Danh sách các yêu cầu COD đã hoàn thành giao hàng và đang chờ xác nhận thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loading text="Đang tải dữ liệu..." />
                </div>
              ) : codPaymentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Không có COD chờ thanh toán</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tất cả COD requests đã được thanh toán hoặc chưa hoàn thành giao hàng
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Container</TableHead>
                      <TableHead>Công ty</TableHead>
                      <TableHead>Phí COD</TableHead>
                      <TableHead>Ngày giao hàng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codPaymentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="mr-2 h-4 w-4" />
                            <span className="font-mono font-medium">
                              {request.container_number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            {request.requesting_org_name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(request.cod_fee)}
                        </TableCell>
                        <TableCell>{formatDate(request.delivery_confirmed_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-orange-300 text-orange-600">
                            Chờ thanh toán
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCodRequest(request)
                              setCodPaymentDialogOpen(true)
                            }}
                          >
                            Xác Nhận Thanh Toán
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tóm Tắt Theo Tổ Chức</CardTitle>
              <CardDescription>
                Thống kê giao dịch và thanh toán theo từng tổ chức
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orgSummary.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Chưa có dữ liệu</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dữ liệu tổ chức sẽ xuất hiện khi có giao dịch
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tổ Chức</TableHead>
                      <TableHead>Tổng Giao Dịch</TableHead>
                      <TableHead>Tổng Tiền</TableHead>
                      <TableHead>Chưa Thanh Toán</TableHead>
                      <TableHead>HĐ Cuối</TableHead>
                      <TableHead>TT Cuối</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgSummary.map((org) => (
                      <TableRow key={org.organization_id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            {org.organization_name}
                          </div>
                        </TableCell>
                        <TableCell>{org.total_transactions}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(org.total_amount)}
                        </TableCell>
                        <TableCell className="font-mono">
                          <span className={org.unpaid_amount > 0 ? 'text-orange-600 font-semibold' : ''}>
                            {formatCurrency(org.unpaid_amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {org.last_invoice_date ? formatDate(org.last_invoice_date) : '-'}
                        </TableCell>
                        <TableCell>
                          {org.last_payment_date ? formatDate(org.last_payment_date) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác Nhận Thanh Toán</DialogTitle>
            <DialogDescription>
              Đánh dấu hóa đơn này đã được thanh toán?
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Số hóa đơn:</div>
                  <div className="font-mono">{selectedInvoice.invoice_number}</div>
                  <div>Tổ chức:</div>
                  <div>{selectedInvoice.organization?.name}</div>
                  <div>Số tiền:</div>
                  <div className="font-mono">{formatCurrency(selectedInvoice.total_amount)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentDialogOpen(false)}
                  disabled={isMarkingPaid}
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleMarkPaid}
                  disabled={isMarkingPaid}
                >
                  {isMarkingPaid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác Nhận Đã Thanh Toán
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* COD Payment Confirmation Dialog */}
      <Dialog open={codPaymentDialogOpen} onOpenChange={setCodPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác Nhận Thanh Toán COD</DialogTitle>
            <DialogDescription>
              Xác nhận rằng phí COD đã được thanh toán cho yêu cầu này?
            </DialogDescription>
          </DialogHeader>
          {selectedCodRequest && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Container:</div>
                  <div className="font-mono">{selectedCodRequest.container_number}</div>
                  <div>Công ty:</div>
                  <div>{selectedCodRequest.requesting_org_name}</div>
                  <div>Phí COD:</div>
                  <div className="font-mono">{formatCurrency(selectedCodRequest.cod_fee)}</div>
                  <div>Ngày giao hàng:</div>
                  <div>{formatDate(selectedCodRequest.delivery_confirmed_at)}</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Xác nhận thanh toán</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Sau khi xác nhận, COD request sẽ chuyển sang trạng thái "Đã thanh toán" 
                      và transaction liên quan sẽ được đánh dấu là PAID.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCodPaymentDialogOpen(false)}
                  disabled={isProcessingCodPayment}
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleConfirmCodPayment}
                  disabled={isProcessingCodPayment}
                >
                  {isProcessingCodPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác Nhận Đã Thanh Toán
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}