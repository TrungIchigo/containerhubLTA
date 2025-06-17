import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Cột Bên Trái - Form Chức Năng */}
        <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="mx-auto w-full max-w-md">
            {children}
          </div>
        </div>
        
        {/* Cột Bên Phải - Visual Branding */}
        <div className="relative hidden lg:flex flex-col items-center justify-center bg-gray-900 text-white p-10">
          {/* Video Nền */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          >
            <source src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logistics-background.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Lớp Phủ Màu */}
          <div className="absolute top-0 left-0 w-full h-full bg-secondary opacity-80 z-10"></div>
          
                    {/* Nội dung trên lớp phủ */}
          <div className="relative z-20 flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent mb-2">
              i-ContainerHub
            </h1>
            <div className="text-2xl font-semibold text-primary mb-6">
              @LTA
            </div>
            <p className="text-xl text-gray-200 font-medium">
              Nền tảng tối ưu hóa logistics container
            </p>
                         <div className="mt-12 max-w-lg">
               <blockquote className="border-l-4 border-primary pl-6 italic text-lg text-gray-100 leading-relaxed">
                 "Biến mỗi container rỗng thành một cơ hội, giảm thiểu chi phí và xây dựng chuỗi cung ứng bền vững."
               </blockquote>
               <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-300">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-white">40%</div>
                   <div>Tiết kiệm chi phí</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-white">50+</div>
                   <div>Đối tác tin cậy</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-white">24/7</div>
                   <div>Hỗ trợ liên tục</div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 