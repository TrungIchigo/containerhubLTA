'use client'

import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import ClientOnly from '@/components/common/ClientOnly';
import DynamicGSAP from '@/components/common/DynamicGSAP';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AuthGuard requireAuth={false}>
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Cột Bên Trái - Form với GSAP Animations - children render trực tiếp */}
        {children}
        
        {/* Cột Bên Phải - Visual Branding với Video Background */}
        <ClientOnly
          fallback={
            <div className="relative hidden lg:flex flex-col items-center justify-center bg-secondary-dark text-secondary-foreground p-10">
              <div className="absolute top-0 left-0 w-full h-full bg-secondary-dark opacity-80 z-10"></div>
              <div className="relative z-20 flex flex-col items-center text-center">
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-secondary-foreground via-primary-light to-primary bg-clip-text text-transparent mb-2">
                  i-ContainerHub
                </h1>
                <div className="text-2xl font-semibold text-primary mb-6">
                  @LTA
                </div>
                <p className="text-xl text-secondary-foreground font-medium">
                  Tối ưu container. Kết nối vận hành. Giảm chi phí.
                </p>
              </div>
            </div>
          }
        >
          <div className="relative hidden lg:flex flex-col items-center justify-center bg-secondary-dark text-secondary-foreground p-10">
            {/* Video Nền */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover z-0"
              suppressHydrationWarning
            >
              <source src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logistics-background.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Lớp Phủ Màu theo Design System */}
            <div className="absolute top-0 left-0 w-full h-full bg-secondary-dark opacity-80 z-10"></div>
            
            {/* Nội dung trên lớp phủ với GSAP animations */}
            <DynamicGSAP />
          </div>
        </ClientOnly>
      </div>
    </AuthGuard>
  );
} 