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
  Clock,
  AlertTriangle,
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

// Add new interface for COD requests
interface CodPaymentRequest {
  id: string
  container_number: string
  requesting_org_name: string
  cod_fee: number
  status: string
  delivery_confirmed_at: string
  days_since_delivery: number
}

export function AdminBillingDashboard() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [orgSummary, setOrgSummary] = useState<OrganizationBillingSummary[]>([])
  const [codPaymentRequests, setCodPaymentRequests] = useState<CodPaymentRequest[]>([])
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
    switch (status) {
      case 'UNPAID':
        return <Badge variant="destructive">Chưa thanh toán</Badge>
      case 'INVOICED':
        return <Badge variant="secondary">Đã xuất hóa đơn</Badge>
      case 'PAID':
        return <Badge variant="default" className="bg-green-100 text-green-800">Đã thanh toán</Badge>
      case 'PENDING':
        return <Badge variant="outline">Chờ thanh toán</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Quá hạn</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Giao Dịch</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_transactions}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.total_amount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chưa Thanh Toán</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.unpaid_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cần xuất hóa đơn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hóa Đơn Chờ</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_invoices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdue_invoices} quá hạn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã Thu</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paid_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Doanh thu thực tế
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Giao Dịch Chưa Xuất</TabsTrigger>
          <TabsTrigger value="invoices">Quản Lý Hóa Đơn</TabsTrigger>
          <TabsTrigger value="cod-payments">COD Chờ Thanh Toán</TabsTrigger>
          <TabsTrigger value="summary">Tóm Tắt Tổ Chức</TabsTrigger>
        </TabsList>

        {/* Unpaid Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Giao Dịch Chưa Xuất Hóa Đơn</CardTitle>
                  <CardDescription>
                    Các giao dịch cần được xuất hóa đơn
                  </CardDescription>
                </div>
                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Tạo Hóa Đơn
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo Hóa Đơn Mới</DialogTitle>
                      <DialogDescription>
                        Chọn tổ chức và khoảng thời gian để tạo hóa đơn
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="organization">Tổ Chức</Label>
                        <select
                          id="organization"
                          className="w-full p-2 border rounded-md"
                          value={selectedOrg}
                          onChange={(e) => setSelectedOrg(e.target.value)}
                        >
                          <option value="">Chọn tổ chức...</option>
                          {orgSummary.map((org) => (
                            <option key={org.organization_id} value={org.organization_id}>
                              {org.organization_name} ({formatCurrency(org.unpaid_amount)} chưa thanh toán)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Từ ngày</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {periodStart ? format(periodStart, 'dd/MM/yyyy') : 'Chọn ngày'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={periodStart}
                                onSelect={setPeriodStart}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label>Đến ngày</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {periodEnd ? format(periodEnd, 'dd/MM/yyyy') : 'Chọn ngày'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={periodEnd}
                                onSelect={setPeriodEnd}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleCreateInvoice} 
                        disabled={isCreatingInvoice}
                        className="w-full"
                      >
                        {isCreatingInvoice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tạo Hóa Đơn
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Không có giao dịch chưa xuất</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tất cả giao dịch đã được xuất hóa đơn hoặc thanh toán
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tổ Chức</TableHead>
                      <TableHead>Loại Giao Dịch</TableHead>
                      <TableHead>Số Tiền</TableHead>
                      <TableHead>Mô Tả</TableHead>
                      <TableHead>Ngày Tạo</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            {transaction.payer_organization?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.transaction_type === 'COD_SERVICE_FEE' ? 'Phí COD' : 'Phí Marketplace'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản Lý Hóa Đơn</CardTitle>
              <CardDescription>
                Tất cả hóa đơn đã phát hành
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Chưa có hóa đơn nào</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hóa đơn sẽ xuất hiện khi bạn tạo từ các giao dịch
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số Hóa Đơn</TableHead>
                      <TableHead>Tổ Chức</TableHead>
                      <TableHead>Kỳ Hạn</TableHead>
                      <TableHead>Tổng Tiền</TableHead>
                      <TableHead>Hạn Thanh Toán</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                      <TableHead>Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            {invoice.organization?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.due_date)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {invoice.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setPaymentDialogOpen(true)
                              }}
                            >
                              Đánh Dấu Đã Trả
                            </Button>
                          )}
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
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  <p className="mt-2 text-muted-foreground">Đang tải dữ liệu...</p>
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
                      <TableHead>Số ngày chờ</TableHead>
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
                          <Badge 
                            variant={request.days_since_delivery > 7 ? "destructive" : request.days_since_delivery > 3 ? "outline" : "secondary"}
                          >
                            {request.days_since_delivery} ngày
                          </Badge>
                        </TableCell>
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
                  <div>Số ngày chờ:</div>
                  <div>
                    <Badge 
                      variant={selectedCodRequest.days_since_delivery > 7 ? "destructive" : "secondary"}
                    >
                      {selectedCodRequest.days_since_delivery} ngày
                    </Badge>
                  </div>
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