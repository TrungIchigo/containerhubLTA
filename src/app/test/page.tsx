export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>If you see this, Next.js is working!</p>
      <div className="mt-4">
        <p>Environment check:</p>
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </div>
  )
} 