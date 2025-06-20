import { toast } from '@/hooks/use-toast'

// Helper functions for standardized toast notifications
export const showSuccessToast = (title: string, description?: string) => {
  return toast({
    title: `✅ ${title}`,
    description,
    variant: "success",
    duration: 4000
  })
}

export const showErrorToast = (title: string, description?: string) => {
  return toast({
    title: `❌ ${title}`,
    description,
    variant: "destructive",
    duration: 6000
  })
}

export const showWarningToast = (title: string, description?: string) => {
  return toast({
    title: `⚠️ ${title}`,
    description,
    variant: "warning",
    duration: 5000
  })
}

export const showInfoToast = (title: string, description?: string) => {
  return toast({
    title: `ℹ️ ${title}`,
    description,
    variant: "info",
    duration: 4000
  })
} 