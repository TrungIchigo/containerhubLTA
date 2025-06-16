import Header from '@/components/common/Header'
import Sidebar from '@/components/common/Sidebar'
import AuthGuard from '@/components/auth/AuthGuard'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={true}>
      <div className="relative min-h-screen bg-background">
        {/* Fixed Header */}
        <Header />
        
        {/* Fixed Sidebar - hidden on mobile, visible on desktop */}
          <Sidebar />
        
        {/* Main Content with responsive margins */}
        <main className="lg:ml-60 mt-[73px] p-4 min-h-screen transition-all duration-300">
          <div className="space-y-4 max-w-full">
              {children}
            </div>
          </main>
      </div>
    </AuthGuard>
  )
} 