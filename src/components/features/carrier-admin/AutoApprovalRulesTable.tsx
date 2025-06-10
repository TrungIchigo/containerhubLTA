'use client'

import { useState, useTransition } from 'react'
import { AutoApprovalRule } from '@/lib/types/auto-approval'
import { 
  toggleRuleStatus, 
  deleteAutoApprovalRule
} from '@/lib/actions/auto-approval'
import { summarizeRuleConditions } from '@/lib/utils/auto-approval'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Settings, Edit, Trash2, Info } from 'lucide-react'
import EditRuleDialog from './EditRuleDialog'
import { useToast } from '@/hooks/use-toast'

interface AutoApprovalRulesTableProps {
  rules: AutoApprovalRule[]
}

export default function AutoApprovalRulesTable({ rules }: AutoApprovalRulesTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleToggleStatus = (ruleId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleRuleStatus(ruleId, !currentStatus)
        toast({
          title: 'Thành công',
          description: `Quy tắc đã được ${!currentStatus ? 'kích hoạt' : 'tạm dừng'}.`,
        })
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể cập nhật trạng thái quy tắc.',
          variant: 'destructive',
        })
      }
    })
  }

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingRuleId(ruleId)
    try {
      await deleteAutoApprovalRule(ruleId)
      toast({
        title: 'Thành công',
        description: 'Quy tắc đã được xóa.',
      })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa quy tắc.',
        variant: 'destructive',
      })
    } finally {
      setDeletingRuleId(null)
    }
  }

  const formatConditionsSummary = (rule: AutoApprovalRule) => {
    if (!rule.conditions || rule.conditions.length === 0) {
      return 'Không có điều kiện'
    }

    const summary = summarizeRuleConditions(rule.conditions)
    const parts = []

    if (summary.containerTypes && summary.containerTypes.length > 0) {
      parts.push(`Loại: ${summary.containerTypes.join(', ')}`)
    }

    if (summary.allowedCompanies && summary.allowedCompanies.length > 0) {
      parts.push(`Công ty được phép: ${summary.allowedCompanies.length} công ty`)
    } else {
      parts.push('Tất cả công ty')
    }

    if (summary.maxDistance !== undefined) {
      parts.push(`Trong bán kính: ${summary.maxDistance}km`)
    }

    return parts.join(' • ')
  }

  if (rules.length === 0) {
    return (
      <Card className="card">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Chưa có quy tắc nào
              </h3>
              <p className="text-text-secondary">
                Tạo quy tắc đầu tiên để bắt đầu tự động hóa quy trình phê duyệt.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card">
      <CardHeader>
        <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent" />
          Danh sách Quy tắc Tự động
          <Badge className="status-info ml-2">
            {rules.length} quy tắc
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="table-header">Tên Quy tắc</TableHead>
                <TableHead className="table-header">Điều kiện Áp dụng</TableHead>
                <TableHead className="table-header text-center">Ưu tiên</TableHead>
                <TableHead className="table-header text-center">Trạng thái</TableHead>
                <TableHead className="table-header text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} className="table-row">
                  <TableCell className="table-cell">
                    <div className="space-y-1">
                      <div className="text-label text-text-primary font-medium">
                        {rule.name}
                      </div>
                      {rule.description && (
                        <div className="text-body-small text-text-secondary">
                          {rule.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="table-cell">
                    <div className="text-body-small text-text-secondary max-w-md">
                      {formatConditionsSummary(rule)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="table-cell text-center">
                    <Badge variant="outline" className="text-body-small">
                      {rule.priority}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="table-cell text-center">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleStatus(rule.id, rule.is_active)}
                      disabled={isPending}
                    />
                  </TableCell>
                  
                  <TableCell className="table-cell">
                    <div className="flex gap-2 justify-center">
                      <EditRuleDialog rule={rule}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[80px]"
                        >
                          <Edit className="w-4 h-4" />
                          Sửa
                        </Button>
                      </EditRuleDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="min-w-[80px]"
                            disabled={deletingRuleId === rule.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <Info className="w-5 h-5 text-danger" />
                              Xác nhận Xóa Quy tắc
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-left">
                              Bạn có chắc chắn muốn xóa quy tắc{' '}
                              <span className="font-semibold">&quot;{rule.name}&quot;</span>?
                              <br />
                              <br />
                              Hành động này không thể hoàn tác và quy tắc sẽ bị xóa vĩnh viễn.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRule(rule.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xác nhận Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 