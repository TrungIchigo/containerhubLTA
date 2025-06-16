'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { 
  validateFile, 
  uploadMultipleFiles, 
  deleteFileFromSupabase,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_MB,
  formatFileSize,
  type UploadProgress
} from '@/lib/utils/fileUpload'
import { useToast } from '@/hooks/use-toast'

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  userId: string
  containerId: string
  maxFiles?: number
  required?: boolean
  label?: string
  description?: string
}

export default function ImageUploader({
  value = [],
  onChange,
  userId,
  containerId,
  maxFiles = 5,
  required = false,
  label = "Hình ảnh tình trạng container",
  description = "Tải lên hình ảnh để ghi lại tình trạng container"
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (value.length + files.length > maxFiles) {
      toast({
        title: "❌ Quá giới hạn",
        description: `Chỉ có thể tải lên tối đa ${maxFiles} hình ảnh`,
        variant: "destructive"
      })
      return
    }

    // Validate each file
    const validFiles: File[] = []
    for (const file of files) {
      const error = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB)
      if (error) {
        toast({
          title: "❌ File không hợp lệ",
          description: `${file.name}: ${error}`,
          variant: "destructive"
        })
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls = await uploadMultipleFiles(
        validFiles,
        'container-images',
        userId,
        containerId,
        (progress) => setUploadProgress(progress)
      )

      // Filter out failed uploads
      const successfulUrls = uploadedUrls.filter(url => url)
      
      if (successfulUrls.length > 0) {
        onChange([...value, ...successfulUrls])
        toast({
          title: "✅ Thành công!",
          description: `Đã tải lên ${successfulUrls.length} hình ảnh`,
          className: "bg-green-50 border-green-200 text-green-800"
        })
      }

      // Show errors for failed uploads
      const failedUploads = uploadProgress.filter(p => p.error)
      if (failedUploads.length > 0) {
        toast({
          title: "⚠️ Một số file không thể tải lên",
          description: `${failedUploads.length} file thất bại`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "❌ Lỗi upload",
        description: "Có lỗi xảy ra khi tải lên hình ảnh",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      setUploadProgress([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [value, onChange, userId, containerId, maxFiles, toast, uploadProgress])

  const handleRemoveImage = useCallback(async (indexToRemove: number) => {
    const urlToRemove = value[indexToRemove]
    
    try {
      // Remove from storage
      await deleteFileFromSupabase(urlToRemove, 'container-images')
      
      // Update state
      const newUrls = value.filter((_, index) => index !== indexToRemove)
      onChange(newUrls)
      
      toast({
        title: "✅ Đã xóa",
        description: "Hình ảnh đã được xóa thành công",
        className: "bg-green-50 border-green-200 text-green-800"
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "❌ Lỗi xóa",
        description: "Không thể xóa hình ảnh",
        variant: "destructive"
      })
    }
  }, [value, onChange, toast])

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {label && (
        <div className="space-y-2">
          <Label className="flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" />
            {label}
            {required && ' *'}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={uploading || value.length >= maxFiles}
          className="flex items-center space-x-2"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>
            {uploading ? 'Đang tải lên...' : 'Chọn hình ảnh'}
          </span>
        </Button>
        
        <span className="text-sm text-muted-foreground font-medium">
          {value.length}/{maxFiles} hình ảnh
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Đang tải lên:</h4>
          {uploadProgress.map((progress, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{progress.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(progress.file.size)}
                </p>
              </div>
              <div className="w-20">
                {progress.error ? (
                  <span className="text-xs text-red-600">Lỗi</span>
                ) : (
                  <span className="text-xs text-green-600">{progress.progress}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border">
                <img
                  src={url}
                  alt={`Container condition ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Xóa hình ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 