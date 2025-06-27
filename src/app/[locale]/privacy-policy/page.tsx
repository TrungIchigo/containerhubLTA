import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/register">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại Đăng ký
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-gray-600">
            i-ContainerHub@LTA - Cam kết Bảo vệ Thông tin Cá nhân
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Giới thiệu
              </h2>
              <p className="text-gray-700 leading-relaxed">
                i-ContainerHub@LTA cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
                Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ 
                thông tin của bạn khi sử dụng nền tảng của chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Thông tin chúng tôi thu thập
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                2.1 Thông tin cá nhân
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Họ và tên đầy đủ</li>
                <li>Địa chỉ email</li>
                <li>Số điện thoại</li>
                <li>Thông tin tổ chức (tên công ty, mã số thuế, địa chỉ)</li>
                <li>Vai trò trong tổ chức</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                2.2 Thông tin hoạt động
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Lịch sử đăng nhập và sử dụng hệ thống</li>
                <li>Các giao dịch và yêu cầu trên nền tảng</li>
                <li>Thông tin container và booking</li>
                <li>Đánh giá và nhận xét về đối tác</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                2.3 Thông tin kỹ thuật
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Địa chỉ IP</li>
                <li>Thông tin trình duyệt và thiết bị</li>
                <li>Cookies và công nghệ theo dõi tương tự</li>
                <li>Log hệ thống và thông tin bảo mật</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Cách chúng tôi sử dụng thông tin
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Cung cấp và vận hành dịch vụ nền tảng</li>
                <li>Xác thực danh tính và bảo mật tài khoản</li>
                <li>Xử lý các giao dịch và yêu cầu</li>
                <li>Liên lạc với bạn về dịch vụ và cập nhật</li>
                <li>Cải thiện chất lượng dịch vụ</li>
                <li>Tuân thủ các yêu cầu pháp lý</li>
                <li>Phòng chống gian lận và lạm dụng</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Chia sẻ thông tin
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chúng tôi cam kết không bán, thuê hoặc trao đổi thông tin cá nhân của bạn 
                với bên thứ ba, trừ những trường hợp sau:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <strong>Với các đối tác trên nền tảng:</strong> Thông tin cần thiết để thực hiện giao dịch
                </li>
                <li>
                  <strong>Với nhà cung cấp dịch vụ:</strong> Các bên hỗ trợ vận hành nền tảng (hosting, email, v.v.)
                </li>
                <li>
                  <strong>Theo yêu cầu pháp lý:</strong> Khi có lệnh của cơ quan có thẩm quyền
                </li>
                <li>
                  <strong>Bảo vệ quyền lợi:</strong> Để bảo vệ quyền lợi hợp pháp của chúng tôi và người dùng
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Bảo mật thông tin
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
                <li>Hệ thống xác thực đa yếu tố (MFA)</li>
                <li>Kiểm soát truy cập nghiêm ngặt</li>
                <li>Sao lưu dữ liệu định kỳ</li>
                <li>Giám sát bảo mật 24/7</li>
                <li>Cập nhật bảo mật thường xuyên</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Quyền của bạn
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Bạn có các quyền sau đối với thông tin cá nhân của mình:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <strong>Quyền truy cập:</strong> Yêu cầu xem thông tin cá nhân chúng tôi lưu trữ
                </li>
                <li>
                  <strong>Quyền chỉnh sửa:</strong> Cập nhật hoặc sửa đổi thông tin không chính xác
                </li>
                <li>
                  <strong>Quyền xóa:</strong> Yêu cầu xóa thông tin cá nhân (trong điều kiện nhất định)
                </li>
                <li>
                  <strong>Quyền hạn chế:</strong> Hạn chế việc xử lý thông tin cá nhân
                </li>
                <li>
                  <strong>Quyền phản đối:</strong> Phản đối việc sử dụng thông tin cho mục đích marketing
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Cookies và công nghệ theo dõi
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi sử dụng cookies và các công nghệ tương tự để cải thiện trải nghiệm người dùng, 
                phân tích lưu lượng truy cập và cá nhân hóa nội dung. Bạn có thể quản lý tùy chọn 
                cookies thông qua cài đặt trình duyệt của mình.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Lưu trữ dữ liệu
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Thông tin cá nhân của bạn được lưu trữ chỉ trong thời gian cần thiết để cung cấp 
                dịch vụ hoặc tuân thủ các yêu cầu pháp lý. Dữ liệu được lưu trữ an toàn tại 
                các trung tâm dữ liệu có chứng nhận bảo mật quốc tế.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Cập nhật chính sách
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi 
                quan trọng sẽ được thông báo trước ít nhất 30 ngày qua email hoặc thông báo 
                trên nền tảng.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Liên hệ
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nếu bạn có câu hỏi về chính sách bảo mật này hoặc muốn thực hiện các quyền của mình, 
                vui lòng liên hệ:
              </p>
              <div className="mt-2 text-gray-700">
                <p>Email: privacy@containerhub-lta.com</p>
                <p>Điện thoại: (028) 1234-5678</p>
                <p>Địa chỉ: Đại học Logistics và Transport, TP.HCM</p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 italic">
                <strong>Lưu ý:</strong> Chính sách này tuân thủ các quy định về bảo vệ dữ liệu 
                cá nhân của Việt Nam và các tiêu chuẩn quốc tế về bảo mật thông tin.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Chính sách này có hiệu lực từ ngày: {new Date().toLocaleDateString('vi-VN')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 