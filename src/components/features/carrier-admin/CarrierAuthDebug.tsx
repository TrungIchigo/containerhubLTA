'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CarrierAuthDebug() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const currentUser = await getCurrentUser()
      console.log('🔍 Debug - Current user:', currentUser)
      setUser(currentUser)
    } catch (err: any) {
      console.error('❌ Debug - Error loading user:', err)
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])
} 