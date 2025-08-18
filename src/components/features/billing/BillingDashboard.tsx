'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/dialog'
import { 
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Download,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@/hooks/use-user'
import {
  getInvoices,
  getUnpaidTransactions,
  getPendingCodPayments
} from '@/lib/actions/billing'
import type { Invoice, Transaction, PendingCodPayment } from '@/lib/types/billing'
import { CodPaymentDialog } from '@/components/features/cod/CodPaymentDialog'
import { Loading } from '@/components/ui/loader'

export function BillingDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingCodPayments, setPendingCodPayments] = useState<PendingCodPayment[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false)
  const [selectedCodPayment, setSelectedCodPayment] = useState<PendingCodPayment | null>(null)
  const [codPaymentDialogOpen, setCodPaymentDialogOpen] = useState(false)
  
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.profile?.organization_id) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user?.profile?.organization_id) {
      console.log('No organization_id found for user:', user);
      return;
    }

    console.log('Loading billing data for organization:', user.profile.organization_id);
    setIsLoading(true)
    try {
      const [invoicesResult, transactionsResult, codPaymentsResult] = await Promise.all([
        getInvoices(user.profile.organization_id),
        getUnpaidTransactions(user.profile.organization_id),
        getPendingCodPayments(user.profile.organization_id)
      ])

      console.log('Invoices result:', invoicesResult);
      console.log('Transactions result:', transactionsResult);

      if (invoicesResult.success) {
        setInvoices(invoicesResult.data!)
        console.log('Set invoices:', invoicesResult.data);
      } else {
        console.error('Failed to load invoices:', invoicesResult.error);
      }
      
      if (transactionsResult.success) {
        setTransactions(transactionsResult.data!)
        console.log('Set transactions:', transactionsResult.data);
      } else {
        console.error('Failed to load transactions:', transactionsResult.error);
      }

      if (codPaymentsResult.success) {
        setPendingCodPayments(codPaymentsResult.data!)
        console.log('Set COD payments:', codPaymentsResult.data);
      } else {
        console.error('Failed to load COD payments:', codPaymentsResult.error);
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu thanh toán",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending-cod-payment">Chờ thanh toán</Badge>
      case 'PAID':
        return <Badge variant="completed">Đã thanh toán</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Quá hạn</Badge>
      case 'UNPAID':
        return <Badge variant="destructive">Chưa xuất hóa đơn</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'COD_SERVICE_FEE':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Phí thay đổi địa điểm</Badge>
      case 'MARKETPLACE_FEE':
        return <Badge variant="outline" className="border-purple-300 text-purple-600">Phí Marketplace</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VNĐ'
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const handleCodPayment = (payment: PendingCodPayment) => {
    setSelectedCodPayment(payment)
    setCodPaymentDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    // Reload data after successful payment
    loadData()
  }

  // Calculate summary stats
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const unpaidAmount = invoices
    .filter(invoice => invoice.status === 'PENDING')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const overdueAmount = invoices
    .filter(invoice => invoice.status === 'PENDING' && isOverdue(invoice.due_date))
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const pendingTransactionAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const pendingCodAmount = pendingCodPayments.reduce((sum, payment) => sum + payment.cod_fee, 0)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loading text="Đang tải dữ liệu thanh toán..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards with Enhanced Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden p-3 border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Tổng Hóa Đơn</CardTitle>
            <div className="p-2 rounded-full bg-blue-500/10">
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {invoices.length}
            </div>
            <p className="text-xs text-blue-600/80 font-medium">
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden p-3 border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Chờ Thanh Toán</CardTitle>
            <div className="p-2 rounded-full bg-orange-500/10">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              {formatCurrency(unpaidAmount)}
            </div>
            <p className="text-xs text-orange-600/80 font-medium">
              {invoices.filter(i => i.status === 'PENDING').length} hóa đơn
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden p-3 border-0 bg-gradient-to-br from-red-50 to-red-100 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Quá Hạn</CardTitle>
            <div className="p-2 rounded-full bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-red-600/80 font-medium">
              Cần thanh toán gấp
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden p-3 border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Chưa Xuất HĐ</CardTitle>
            <div className="p-2 rounded-full bg-green-500/10">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              {formatCurrency(pendingTransactionAmount)}
            </div>
            <p className="text-xs text-green-600/80 font-medium">
              {transactions.length} giao dịch
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden p-3 border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Phí thay đổi địa điểm</CardTitle>
            <div className="p-2 rounded-full bg-purple-500/10">
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              {formatCurrency(pendingCodAmount)}
            </div>
            <p className="text-xs text-purple-600/80 font-medium">
              {pendingCodPayments.length} thanh toán chờ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions Alert with Enhanced Design */}
      {transactions.length > 0 && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg ml-3">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent font-bold py-3">
                  Giao Dịch Chờ Xuất Hóa Đơn
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium mb-3">
                  Các giao dịch này sẽ được đưa vào hóa đơn tiếp theo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              {transactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    {getTransactionTypeBadge(transaction.transaction_type)}
                    <span className="text-sm font-medium text-gray-700">{transaction.description}</span>
                  </div>
                  <div className="text-sm font-mono bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
              {transactions.length > 3 && (
                <div className="text-sm text-center py-2 text-gray-600 font-medium">
                  ... và {transactions.length - 3} giao dịch khác
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending COD Payments Section */}
      {pendingCodPayments.length > 0 && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-pink-500/10"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="bg-gradient-to-r from-orange-700 to-pink-700 bg-clip-text text-transparent font-bold">
                  Phí Thay Đổi Địa Điểm Chờ Thanh Toán
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Các khoản phí thay đổi địa điểm cần được thanh toán sau khi giao trả thành công
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              {pendingCodPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-blue-300 text-blue-600">
                      Container {payment.container_number}
                    </Badge>
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">{payment.original_depot_address}</div>
                      <ArrowRight className="w-4 h-4 inline mx-1 text-gray-400" />
                      <div className="font-medium text-blue-600 inline">{payment.requested_depot_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-mono bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent font-bold">
                        {formatCurrency(payment.cod_fee)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(payment.delivery_confirmed_at)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCodPayment(payment)}
                      className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Thanh toán ngay
                    </Button>
                  </div>
                </div>
              ))}
              {pendingCodPayments.length > 3 && (
                <div className="text-sm text-center py-2 text-gray-600 font-medium">
                  ... và {pendingCodPayments.length - 3} thanh toán khác
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List with Enhanced Design */}
      <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-text-primary font-bold text-xl">Hóa Đơn</CardTitle>
              <CardDescription className="text-text-primary">
                Danh sách tất cả hóa đơn của công ty bạn
              </CardDescription>
            </div>
          </div>
      </CardHeader>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-gray-50 shadow-lg">        
        <CardContent className="relative">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full">
                <Receipt className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có hóa đơn nào</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Hóa đơn sẽ được tạo từ các giao dịch của bạn. Khi có giao dịch, hóa đơn sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số Hóa Đơn</TableHead>
                  <TableHead>Kỳ Hạn</TableHead>
                  <TableHead>Ngày Phát Hành</TableHead>
                  <TableHead>Hạn Thanh Toán</TableHead>
                  <TableHead>Số Tiền</TableHead>
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
                      {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.issue_date)}
                    </TableCell>
                    <TableCell>
                      <span className={isOverdue(invoice.due_date) && invoice.status === 'PENDING' ? 'text-red-600 font-semibold' : ''}>
                        {formatDate(invoice.due_date)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setInvoiceDetailOpen(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={invoiceDetailOpen} onOpenChange={setInvoiceDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Hóa Đơn</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và các giao dịch trong hóa đơn
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Số hóa đơn</div>
                  <div className="font-mono text-lg">{selectedInvoice.invoice_number}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Trạng thái</div>
                  <div>{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Kỳ hạn</div>
                  <div>{formatDate(selectedInvoice.period_start)} - {formatDate(selectedInvoice.period_end)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Hạn thanh toán</div>
                  <div className={isOverdue(selectedInvoice.due_date) && selectedInvoice.status === 'PENDING' ? 'text-red-600 font-semibold' : ''}>
                    {formatDate(selectedInvoice.due_date)}
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-4">
                <h4 className="font-semibold">Chi tiết giao dịch</h4>
                {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Số tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {getTransactionTypeBadge(transaction.transaction_type)}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Không có thông tin chi tiết giao dịch
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              {selectedInvoice.status === 'PENDING' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-800">Thông tin thanh toán</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        Vui lòng thanh toán trước ngày {formatDate(selectedInvoice.due_date)}. 
                        Liên hệ admin để biết thông tin tài khoản thanh toán.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedInvoice.payment_date && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Đã thanh toán vào ngày {formatDate(selectedInvoice.payment_date)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInvoiceDetailOpen(false)}>
                  Đóng
                </Button>
                <Button disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Tải PDF (Sắp có)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* COD Payment Dialog */}
      <CodPaymentDialog
        open={codPaymentDialogOpen}
        onOpenChange={setCodPaymentDialogOpen}
        payment={selectedCodPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}