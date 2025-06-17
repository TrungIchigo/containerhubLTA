import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, otpCode, fullName, companyName } = await req.json()

  // If RESEND_API_KEY is not available, fall back to console logging
  if (!RESEND_API_KEY) {
    console.log(`📧 OTP Email (No API Key): ${to} - Code: ${otpCode}`)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Email service not configured',
        otpCode: otpCode // Return OTP for testing
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

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
        subject: 'Mã xác thực đăng ký - i-ContainerHub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4CAF50, #2196F3); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">i-ContainerHub</h1>
              <p style="color: white; margin: 10px 0 0 0;">Nền tảng kết nối vận tải container</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Xin chào ${fullName},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                Cảm ơn bạn đã đăng ký tài khoản cho <strong>${companyName}</strong> trên i-ContainerHub.
              </p>
              
              <p style="color: #666; line-height: 1.6;">
                Để hoàn tất quá trình đăng ký, vui lòng nhập mã xác thực sau vào trang web:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #fff; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; display: inline-block;">
                  <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Mã xác thực của bạn:</div>
                  <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px;">${otpCode}</div>
                </div>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Lưu ý:</strong> Mã xác thực này có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với ai khác.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  Email này được gửi từ hệ thống i-ContainerHub.<br>
                  Để được hỗ trợ, vui lòng liên hệ: support@containerhub.vn
                </p>
              </div>
            </div>
          </div>
        `,
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
          error: error,
          otpCode: otpCode // Return OTP for testing when email fails
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        otpCode: otpCode // Return OTP for testing when email fails
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  }
}) 