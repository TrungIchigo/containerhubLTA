import { getCurrentUser } from '@/lib/actions/auth'
import { getAutoApprovalRules } from '@/lib/actions/auto-approval'
import { redirect } from 'next/navigation'
import { Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AutoApprovalRulesTable from '@/components/features/carrier-admin/AutoApprovalRulesTable'
import CreateRuleDialog from '@/components/features/carrier-admin/CreateRuleDialog'

export default async function AutoApprovalRulesPage() {
  // Authentication check
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (user.profile?.role !== 'CARRIER_ADMIN') {
    redirect('/dashboard')
  }

  try {
    const rules = await getAutoApprovalRules()

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Quản lý Quy tắc Phê duyệt Tự động
              </h1>
              <p className="text-text-secondary mt-1">
                Thiết lập các quy tắc để hệ thống tự động phê duyệt các yêu cầu tái sử dụng container, giúp bạn tiết kiệm thời gian và tăng hiệu quả.
              </p>
            </div>
          </div>

          <CreateRuleDialog>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Tạo Quy tắc Mới
            </Button>
          </CreateRuleDialog>
        </div>

        {/* Auto Approval Rules Table */}
        <AutoApprovalRulesTable rules={rules} />

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Cách hoạt động của Quy tắc Tự động
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>Độ ưu tiên:</strong> Quy tắc có số ưu tiên thấp hơn sẽ được kiểm tra trước (1 = cao nhất).
            </p>
            <p>
              • <strong>Điều kiện &quot;VÀ&quot;:</strong> Tất cả các điều kiện trong một quy tắc phải được thỏa mãn.
            </p>
            <p>
              • <strong>Phê duyệt tức thì:</strong> Khi một yêu cầu khớp với quy tắc, hệ thống sẽ tự động phê duyệt trong vài mili giây.
            </p>
            <p>
              • <strong>Bật/Tắt linh hoạt:</strong> Bạn có thể tạm dừng quy tắc bất kỳ lúc nào mà không cần xóa.
            </p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading auto approval rules:', error)
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Quản lý Quy tắc Phê duyệt Tự động
            </h1>
            <p className="text-danger mt-1">
              Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
            </p>
          </div>
        </div>
      </div>
    )
  }
} 