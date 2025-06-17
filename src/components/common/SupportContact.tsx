'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { HelpCircle, LifeBuoy, MessageCircle, Phone, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SupportContactProps {
  className?: string
  compact?: boolean // For sidebar usage
}

export default function SupportContact({ className = '', compact = true }: SupportContactProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const supportOptions = [
    {
      label: 'Chat Trực tuyến',
      description: 'Hỗ trợ tức thì qua chat',
      icon: MessageCircle,
      action: () => {
        // Tích hợp với chat widget (Intercom, Tawk.to, Zalo...)
        console.log('Opening chat widget...')
        // window.Intercom && window.Intercom('show')
        // hoặc window.tawk && window.tawk.maximize()
        alert('Tính năng chat đang được phát triển. Vui lòng liên hệ qua email hoặc điện thoại.')
        setIsDialogOpen(false)
      },
      available: true
    },
    {
      label: 'Gọi Điện Thoại',
      description: 'Hotline hỗ trợ 24/7',
      icon: Phone,
      action: () => {
        window.open('tel:+842839101234')
        setIsDialogOpen(false)
      },
      available: true,
      contact: '+84 28 3910 1234'
    },
    {
      label: 'Gửi Email',
      description: 'Support qua email',
      icon: Mail,
      action: () => {
        window.open('mailto:support@containerhub.com?subject=Yêu cầu hỗ trợ ContainerHub')
        setIsDialogOpen(false)
      },
      available: true,
      contact: 'support@containerhub.com'
    }
  ]

  if (compact) {
    // Compact version for sidebar
    return (
      <div className={`${className}`}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <LifeBuoy className="w-3 h-3 mr-2" />
                    Liên hệ Hỗ trợ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <LifeBuoy className="w-5 h-5 text-primary" />
                      Hỗ Trợ Khách Hàng
                    </DialogTitle>
                    <DialogDescription>
                      Chọn phương thức liên hệ phù hợp với bạn
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {supportOptions.map((option, index) => {
                      const IconComponent = option.icon
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start h-auto p-4"
                          onClick={option.action}
                          disabled={!option.available}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                              {option.contact && (
                                <div className="text-sm text-primary font-mono">
                                  {option.contact}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                  <div className="text-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Thời gian hỗ trợ: 8:00 - 18:00 (Thứ 2 - Thứ 6)
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
      </div>
    )
  }

  // Full version for standalone usage
  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LifeBuoy className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Cần Hỗ Trợ?
        </h3>
        <p className="text-text-secondary">
          Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp bạn
        </p>
      </div>

      <div className="space-y-3">
        {supportOptions.map((option, index) => {
          const IconComponent = option.icon
          return (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={option.action}
              disabled={!option.available}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                  {option.contact && (
                    <div className="text-sm text-primary font-mono">
                      {option.contact}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      <Separator className="my-6" />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Thời gian hỗ trợ
        </p>
        <p className="text-sm font-medium">
          8:00 - 18:00 (Thứ 2 - Thứ 6)
        </p>
      </div>
    </Card>
  )
} 