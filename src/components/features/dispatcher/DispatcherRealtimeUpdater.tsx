'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DispatcherRealtimeUpdaterProps {
  userOrgId: string
}

export function DispatcherRealtimeUpdater({ userOrgId }: DispatcherRealtimeUpdaterProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const channel = supabase.channel(`dispatcher-updates-for-${userOrgId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'street_turn_requests',
          filter: `requesting_org_id=eq.${userOrgId}` // Chỉ lắng nghe thay đổi trên yêu cầu của mình
        },
        async (payload) => {
          console.log('Real-time update received:', payload)
          
          const newStatus = payload.new.status
          const oldStatus = payload.old.status
          
          // Chỉ hiển thị thông báo khi status thay đổi
          if (newStatus !== oldStatus) {
            // Lấy thông tin container để hiển thị trong toast
            const { data: requestDetail } = await supabase
              .from('street_turn_requests')
              .select(`
                *,
                import_container:import_containers(*),
                export_booking:export_bookings(*)
              `)
              .eq('id', payload.new.id)
              .single()

            const containerNumber = requestDetail?.import_container?.container_number || 'N/A'
            const bookingNumber = requestDetail?.export_booking?.booking_number || 'N/A'
            
            if (newStatus === 'APPROVED') {
              toast({
                title: "🎉 Yêu cầu được phê duyệt!",
                description: `Re-use container ${containerNumber} → lệnh ${bookingNumber} đã được chấp thuận.`,
                variant: 'default',
                duration: 5000,
              })
            } else if (newStatus === 'DECLINED') {
              const declineReason = payload.new.decline_reason
              toast({
                title: "❌ Yêu cầu bị từ chối",
                description: `Container ${containerNumber} đã bị từ chối. ${declineReason ? `Lý do: ${declineReason}` : ''}`,
                variant: 'destructive',
                duration: 7000,
              })
            }

            // LÀM MỚI DỮ LIỆU GIAO DIỆN
            // router.refresh() sẽ tải lại Server Component của trang hiện tại
            // mà không làm mất state của Client Component.
            router.refresh()
          }
        }
      )
      .subscribe()

    // Cleanup function để hủy đăng ký khi component unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast, userOrgId, router])

  return null // Component này không render gì cả, chỉ chứa logic
}