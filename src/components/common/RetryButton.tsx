'use client'

interface RetryButtonProps {
  children: React.ReactNode
  className?: string
}

export default function RetryButton({ children, className }: RetryButtonProps) {
  return (
    <button 
      onClick={() => window.location.reload()}
      className={className || "px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200"}
    >
      {children}
    </button>
  )
}

export const ErrorSection = ({ title, error }: { title: string; error: string }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <h3 className="font-medium text-red-800 mb-2">
      {title}
    </h3>
    <p className="text-red-700 text-sm mb-3">
      {error}
    </p>
    <RetryButton>
      Thử lại
    </RetryButton>
  </div>
) 