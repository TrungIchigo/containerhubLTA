import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
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
            Điều Khoản Dịch Vụ
          </h1>
          <p className="text-gray-600">
            i-ContainerHub@LTA - Nền tảng Tối ưu hóa Container
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Chấp nhận Điều khoản
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Bằng việc đăng ký và sử dụng nền tảng i-ContainerHub@LTA ("Nền tảng"), 
                bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu ra dưới đây. 
                Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Mô tả Dịch vụ
              </h2>
              <p className="text-gray-700 leading-relaxed">
                i-ContainerHub@LTA là một nền tảng công nghệ trung gian, kết nối các Công ty Vận tải 
                và Hãng tàu nhằm mục đích tối ưu hóa việc tái sử dụng container (Street-turn) và 
                thay đổi nơi trả container (COD). Chúng tôi không phải là một bên trong các hợp đồng 
                vận chuyển và không chịu trách nhiệm về tình trạng vật lý của container hay hàng hóa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Trách nhiệm của Người dùng
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Bạn cam kết cung cấp thông tin chính xác, đầy đủ và hợp pháp khi đăng ký 
                  và tạo các lệnh trên hệ thống.
                </li>
                <li>
                  Bạn chịu hoàn toàn trách nhiệm về các giao dịch, thỏa thuận và các vấn đề 
                  phát sinh với các đối tác của mình trên nền tảng.
                </li>
                <li>
                  Bạn có trách nhiệm tuân thủ các quy định của hãng tàu và pháp luật hiện hành 
                  liên quan đến việc vận chuyển và sử dụng container.
                </li>
                <li>
                  Bảo mật thông tin đăng nhập của bạn và thông báo ngay lập tức cho chúng tôi 
                  nếu có nghi ngờ tài khoản bị xâm phạm.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Quyền của i-ContainerHub@LTA
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản của bạn nếu phát hiện 
                có hành vi gian lận, cung cấp thông tin sai sự thật hoặc vi phạm các điều khoản này. 
                Chúng tôi cũng có quyền thay đổi, cập nhật các điều khoản dịch vụ và sẽ thông báo 
                trước cho người dùng ít nhất 30 ngày.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Phí dịch vụ và Thanh toán
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nền tảng có thể thu phí cho một số tính năng nâng cao. Mọi phí dịch vụ sẽ được 
                thông báo rõ ràng trước khi áp dụng. Việc thanh toán được thực hiện qua các 
                phương thức được chúng tôi chấp nhận và tuân thủ các quy định về thuế hiện hành.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Giới hạn Trách nhiệm
              </h2>
              <p className="text-gray-700 leading-relaxed">
                i-ContainerHub@LTA không chịu trách nhiệm về bất kỳ thiệt hại trực tiếp hoặc 
                gián tiếp nào phát sinh từ việc sử dụng nền tảng, bao gồm nhưng không giới hạn: 
                mất mát kinh doanh, mất dữ liệu, hoặc các vấn đề phát sinh từ giao dịch giữa 
                các bên thứ ba trên nền tảng.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Chính sách Bảo mật
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Vui lòng tham khảo{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                  Chính sách Bảo mật
                </Link>{' '}
                của chúng tôi để hiểu rõ cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Liên hệ
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ với chúng tôi qua:
              </p>
              <div className="mt-2 text-gray-700">
                <p>Email: support@containerhub-lta.com</p>
                <p>Điện thoại: (028) 1234-5678</p>
                <p>Địa chỉ: Đại học Logistics và Transport, TP.HCM</p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 italic">
                <strong>Lưu ý:</strong> Nội dung này chỉ mang tính tham khảo và cần được tư vấn 
                bởi luật sư để đảm bảo tính chính xác và tuân thủ pháp luật hiện hành.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Điều khoản này có hiệu lực từ ngày: <span suppressHydrationWarning>{new Date().toLocaleDateString('vi-VN')}</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 