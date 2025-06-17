'use server'

import { createClient } from '@/lib/supabase/server'
import type { ContainerType } from '@/lib/types'

// Get all container types - SERVER ACTION
export async function getContainerTypes(): Promise<ContainerType[]> {
  try {
    const supabase = await createClient()
    
    const { data: containerTypes, error } = await supabase
      .from('container_types')
      .select('*')
      .order('code')

    if (error) {
      console.error('Error fetching container types:', error)
      throw error
    }

    return containerTypes || []
  } catch (error: any) {
    console.error('Error in getContainerTypes:', error)
    throw new Error('Failed to fetch container types')
  }
}

// Get container type by ID - SERVER ACTION
export async function getContainerTypeById(id: string): Promise<ContainerType | null> {
  try {
    const supabase = await createClient()
    
    const { data: containerType, error } = await supabase
      .from('container_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching container type:', error)
      throw error
    }

    return containerType
  } catch (error: any) {
    console.error('Error in getContainerTypeById:', error)
    throw new Error('Failed to fetch container type')
  }
}

// Get container type by code - SERVER ACTION
export async function getContainerTypeByCode(code: string): Promise<ContainerType | null> {
  try {
    const supabase = await createClient()
    
    const { data: containerType, error } = await supabase
      .from('container_types')
      .select('*')
      .eq('code', code)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching container type:', error)
      throw error
    }

    return containerType
  } catch (error: any) {
    console.error('Error in getContainerTypeByCode:', error)
    throw new Error('Failed to fetch container type')
  }
} 