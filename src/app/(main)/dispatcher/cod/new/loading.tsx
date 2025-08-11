import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div className="flex-1">
            <Skeleton className="h-6 w-80 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-80 bg-white border-r shadow-sm">
          <div className="p-4 border-b">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Map Area Skeleton */}
        <div className="flex-1 relative">
          <Skeleton className="absolute top-4 left-4 h-9 w-28 z-10" />
          <Skeleton className="w-full h-full" />
        </div>
      </div>
      
      {/* Bottom Action Bar Skeleton */}
      <div className="bg-white border-t px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}