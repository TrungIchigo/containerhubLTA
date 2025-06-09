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
      <div className="main-content">
        <Header />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 bg-background">
            <div className="space-y-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
} 