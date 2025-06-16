'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, FileText, Loader2, Download, Eye } from 'lucide-react'
import { 
  validateFile, 
  uploadMultipleFiles, 
  deleteFileFromSupabase,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_MB,
  formatFileSize,
  type UploadProgress
} from '@/lib/utils/fileUpload'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  userId: string
  containerId: string
  maxFiles?: number
  required?: boolean
  label?: string
  description?: string
}

export default function DocumentUploader({
  value = [],
  onChange,
  userId,
  containerId,
  maxFiles = 10,
  required = false,
  label = "Đính kèm chứng từ",
  description = "Tải lên các chứng từ liên quan (tùy chọn)"
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(extension || '')) {
      return <FileText className="w-6 h-6 text-red-500" />
    }
    if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-6 h-6 text-blue-500" />
    }
    if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return <FileText className="w-6 h-6 text-green-500" />
    }
    return <FileText className="w-6 h-6 text-gray-500" />
  }

  const getFileName = (url: string) => {
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    // Remove timestamp and UUID from filename for display
    const cleanName = fileName.replace(/^\d+_[a-f0-9-]+\./, '')
    return cleanName
  }

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (value.length + files.length > maxFiles) {
      toast({
        title: "❌ Quá giới hạn",
        description: `Chỉ có thể tải lên tối đa ${maxFiles} file`,
        variant: "destructive"
      })
      return
    }

    // Validate each file
    const validFiles: File[] = []
    for (const file of files) {
      const error = validateFile(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_MB)
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
        'documents',
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
          description: `Đã tải lên ${successfulUrls.length} file`,
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
        description: "Có lỗi xảy ra khi tải lên file",
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

  const handleRemoveDocument = useCallback(async (indexToRemove: number) => {
    const urlToRemove = value[indexToRemove]
    
    try {
      // Remove from storage
      await deleteFileFromSupabase(urlToRemove, 'documents')
      
      // Update state
      const newUrls = value.filter((_, index) => index !== indexToRemove)
      onChange(newUrls)
      
      toast({
        title: "✅ Đã xóa",
        description: "File đã được xóa thành công",
        className: "bg-green-50 border-green-200 text-green-800"
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "❌ Lỗi xóa",
        description: "Không thể xóa file",
        variant: "destructive"
      })
    }
  }, [value, onChange, toast])

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handlePreview = (url: string) => {
    window.open(url, '_blank')
  }

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {label && (
        <div className="space-y-2">
          <Label className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
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
            {uploading ? 'Đang tải lên...' : 'Chọn file'}
          </span>
        </Button>
        
        <span className="text-sm text-muted-foreground font-medium">
          {value.length}/{maxFiles} file
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_DOCUMENT_TYPES.join(',')}
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

      {/* Document List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">File đã tải lên:</h4>
          <div className="space-y-2">
            {value.map((url, index) => {
              const fileName = getFileName(url)
              return (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg group">
                  {getFileIcon(url)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileName}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(url)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xem trước"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(url, fileName)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Tải xuống"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                      title="Xóa file"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 