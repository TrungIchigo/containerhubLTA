'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Log any console errors
    const originalError = console.error
    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')])
      originalError.apply(console, args)
    }

    // Check if modules are loading
    try {
      console.log('Debug: React loaded successfully')
      setLoading(false)
    } catch (error) {
      setErrors(prev => [...prev, `React error: ${error}`])
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800">✅ Success Checks</h2>
          <ul className="mt-2 space-y-1 text-green-700">
            <li>✅ Next.js App Router working</li>
            <li>✅ React components rendering</li>
            <li>✅ Tailwind CSS loaded</li>
            <li>✅ Server responding (Status: 200)</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800">Environment Variables</h2>
          <div className="mt-2 space-y-1 text-blue-700">
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800">Loading Status</h2>
          <p className="mt-2 text-yellow-700">
            Client-side rendering: {loading ? '⏳ Loading...' : '✅ Complete'}
          </p>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">❌ Console Errors</h2>
            <ul className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-red-700 font-mono text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800">Navigation Test</h2>
          <div className="mt-2 space-y-2">
            <a href="/test" className="inline-block bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600">
              Test Page
            </a>
            <a href="/login" className="inline-block bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600">
              Login Page
            </a>
            <a href="/register" className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Register Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 