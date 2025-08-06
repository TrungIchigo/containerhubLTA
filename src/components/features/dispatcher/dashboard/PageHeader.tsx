'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PageHeaderProps {
  activeTab: string
  onTabChange: (value: string) => void
  totalCount: number
  title: string
}

export function PageHeader({
  activeTab,
  onTabChange,
  totalCount,
  title
}: PageHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow border p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Left side - Title and Tabs */}
        <div className="flex-1">
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="flex w-full bg-gray-100 rounded-lg overflow-hidden p-1">
              <TabsTrigger value="dropoff" className="flex-1 flex items-center justify-center gap-2 text-base font-semibold py-3 transition-all
                hover:bg-green-600 focus:bg-green-200
                data-[state=active]:bg-primary data-[state=active]:text-white
                text-gray-800 rounded-none first:rounded-l-lg last:rounded-r-lg border-r border-white">
                📦 Lệnh Giao Trả
              </TabsTrigger>
              <TabsTrigger value="pickup" className="flex-1 flex items-center justify-center gap-2 text-base font-semibold py-3 transition-all
                hover:bg-green-600 focus:bg-green-200
                data-[state=active]:bg-primary data-[state=active]:text-white
                text-gray-800 rounded-none border-r border-white">
                🚛 Lệnh Lấy Rỗng
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex-1 flex items-center justify-center gap-2 text-base font-semibold py-3 transition-all
                hover:bg-green-600 focus:bg-green-200
                data-[state=active]:bg-primary data-[state=active]:text-white
                text-gray-800 rounded-none last:rounded-r-lg">
                🔄 Gợi ý Re-use
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  )
}