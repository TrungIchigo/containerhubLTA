import AuthGuard from '@/components/auth/AuthGuard'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">i-ContainerHub@LTA</h1>
            <p className="text-muted-foreground mt-2">
              Nền tảng tối ưu hóa logistics container
            </p>
          </div>
          {children}
        </div>
      </div>
    </AuthGuard>
  )
} 