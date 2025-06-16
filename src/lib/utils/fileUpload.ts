import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface UploadProgress {
  file: File
  progress: number
  url?: string
  error?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Validate file type and size
export function validateFile(file: File, allowedTypes: string[], maxSizeInMB: number): string | null {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    return `File quá lớn. Kích thước tối đa: ${maxSizeInMB}MB`
  }

  return null
}

// Generate unique file path
export function generateFilePath(userId: string, containerId: string, originalFileName: string, bucket: string): string {
  const fileExtension = originalFileName.split('.').pop()
  const uniqueId = uuidv4()
  const timestamp = Date.now()
  
  return `${userId}/${containerId}/${timestamp}_${uniqueId}.${fileExtension}`
}

// Upload single file to Supabase Storage
export async function uploadFileToSupabase(
  file: File, 
  bucket: string, 
  filePath: string
): Promise<UploadResult> {
  try {
    const supabase = createClient()
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload file'
    }
  }
}

// Upload multiple files with progress tracking
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  userId: string,
  containerId: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<string[]> {
  const results: string[] = []
  const progressArray: UploadProgress[] = files.map(file => ({
    file,
    progress: 0
  }))

  // Initial progress update
  onProgress?.(progressArray)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filePath = generateFilePath(userId, containerId, file.name, bucket)
    
    try {
      // Update progress - uploading
      progressArray[i].progress = 50
      onProgress?.(progressArray)

      const result = await uploadFileToSupabase(file, bucket, filePath)
      
      if (result.success && result.url) {
        results.push(result.url)
        // Update progress - success
        progressArray[i].progress = 100
        progressArray[i].url = result.url
      } else {
        // Update progress - error
        progressArray[i].error = result.error
      }
    } catch (error) {
      progressArray[i].error = error instanceof Error ? error.message : 'Upload failed'
    }
    
    onProgress?.(progressArray)
  }

  return results
}

// Delete file from storage
export async function deleteFileFromSupabase(url: string, bucket: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Extract file path from URL
    const urlParts = url.split('/')
    const bucketIndex = urlParts.findIndex(part => part === bucket)
    if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
      console.error('Invalid URL format')
      return false
    }
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/')
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}

// Predefined file type constants
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/heic'
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png'
]

export const MAX_IMAGE_SIZE_MB = 10
export const MAX_DOCUMENT_SIZE_MB = 50

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 