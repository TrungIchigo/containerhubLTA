'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContainerType } from '@/lib/types'

export function useContainerTypes() {
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContainerTypes() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('container_types')
          .select('*')
          .order('code')

        if (error) {
          throw error
        }

        setContainerTypes(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching container types:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchContainerTypes()
  }, [])

  return { containerTypes, loading, error }
} 