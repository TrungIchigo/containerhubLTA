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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
} 