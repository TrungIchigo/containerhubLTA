import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface RequestBody {
  to: string;
  fullName: string;
  companyName: string;
  status: string;
  rejectionReason?: string;
}

serve(async (req: Request) => {
  const { to, fullName, companyName, status, rejectionReason }: RequestBody = await req.json()

  // If RESEND_API_KEY is not available, fall back to console logging
  if (!RESEND_API_KEY) {
    console.log(`📧 Approval Email (No API Key): ${to} - Status: ${status}`)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Email service not configured'
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  const isApproved = status === 'approved'
  const subject = isApproved 
    ? 'Chúc mừng! Tổ chức của bạn đã được phê duyệt - i-ContainerHub'
    : 'Thông báo về yêu cầu đăng ký tổ chức - i-ContainerHub'

  const htmlContent = isApproved ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981, #2196F3); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 i-ContainerHub</h1>
        <p style="color: white; margin: 10px 0 0 0;">Nền tảng kết nối vận tải container</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #10B981;">Chúc mừng ${fullName}!</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Tổ chức <strong>${companyName}</strong> của bạn đã được phê duyệt thành công trên hệ thống i-ContainerHub.
        </p>
        
        <div style="background: #D1FAE5; border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #065F46; margin: 0 0 15px 0;">✅ Tài khoản đã được kích hoạt</h3>
          <p style="color: #065F46; margin: 0; line-height: 1.6;">
            Bây giờ bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của i-ContainerHub để quản lý và kết nối các dịch vụ vận tải container.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/login" 
             style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Đăng nhập ngay
          </a>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Bước tiếp theo:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>Đăng nhập vào hệ thống với email và mật khẩu đã đăng ký</li>
          <li>Hoàn thiện thông tin profile của tổ chức</li>
          <li>Bắt đầu đăng tải container hoặc tìm kiếm đối tác vận chuyển</li>
          <li>Khám phá các tính năng marketplace và quản lý booking</li>
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            Email này được gửi từ hệ thống i-ContainerHub.<br>
            Để được hỗ trợ, vui lòng liên hệ: support@containerhub.vn
          </p>
        </div>
      </div>
    </div>
  ` : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">i-ContainerHub</h1>
        <p style="color: white; margin: 10px 0 0 0;">Nền tảng kết nối vận tải container</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #EF4444;">Thông báo về yêu cầu đăng ký</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Xin chào ${fullName},
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          Chúng tôi đã xem xét yêu cầu đăng ký tổ chức <strong>${companyName}</strong> trên hệ thống i-ContainerHub.
        </p>
        
        <div style="background: #FEE2E2; border: 1px solid #EF4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #DC2626; margin: 0 0 15px 0;">❌ Yêu cầu không được phê duyệt</h3>
          <p style="color: #DC2626; margin: 0 0 10px 0; font-weight: bold;">Lý do:</p>
          <p style="color: #DC2626; margin: 0; line-height: 1.6;">
            ${rejectionReason || 'Không có lý do cụ thể được cung cấp.'}
          </p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Bước tiếp theo:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>Xem xét và khắc phục các vấn đề được nêu trong lý do từ chối</li>
          <li>Chuẩn bị đầy đủ các giấy tờ và thông tin cần thiết</li>
          <li>Thực hiện đăng ký lại với thông tin chính xác và đầy đủ</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/register" 
             style="background: #6B7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Đăng ký lại
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Nếu bạn có bất kỳ câu hỏi nào về quyết định này, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            Email này được gửi từ hệ thống i-ContainerHub.<br>
            Để được hỗ trợ, vui lòng liên hệ: support@containerhub.vn
          </p>
        </div>
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'i-ContainerHub <noreply@containerhub.vn>',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { "Content-Type": "application/json" },
      })
    } else {
      const error = await res.text()
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    console.error('Email sending error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  }
}) 