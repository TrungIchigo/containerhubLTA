'use client'

import { Star } from 'lucide-react'
import type { MatchSuggestion } from './types'

interface MatchingSummaryProps {
  suggestions: MatchSuggestion[]
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function MatchingSummary({ suggestions }: MatchingSummaryProps) {
  // Calculate stats
  const containerCount = suggestions.length
  const totalBookings = suggestions.reduce((sum, s) => sum + s.export_bookings.length, 0)
  const maxScore = Math.max(...suggestions.flatMap(s => s.export_bookings.map(b => b.matching_score.total_score)))
  const avgScore = suggestions.flatMap(s => s.export_bookings.map(b => b.matching_score.total_score))
    .reduce((sum, score) => sum + score, 0) / totalBookings

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-4">Tổng Quan Gợi Ý Ghép Nối V2.0</h2>
      
      <div className="grid grid-cols-4 gap-6">
        {/* Container Count */}
        <div 
          className="rounded-xl p-6 shadow-sm text-center relative overflow-hidden 
            bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20
            transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="text-4xl font-bold text-primary mb-3 tracking-tight">
              {containerCount}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Container có cơ hội
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div 
          className="rounded-xl p-6 shadow-sm text-center relative overflow-hidden
            bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:from-blue-500/10 hover:to-blue-500/20
            transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="text-4xl font-bold text-blue-600 mb-3 tracking-tight">
              {totalBookings}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Tổng cơ hội ghép nối
            </div>
          </div>
        </div>

        {/* Max Score */}
        <div 
          className="rounded-xl p-6 shadow-sm text-center relative overflow-hidden
            bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:from-purple-500/10 hover:to-purple-500/20
            transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="text-4xl font-bold text-purple-600 mb-3 tracking-tight">
              {maxScore}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Điểm cao nhất
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div 
          className="rounded-xl p-6 shadow-sm text-center relative overflow-hidden
            bg-gradient-to-br from-orange-500/5 to-orange-500/10 hover:from-orange-500/10 hover:to-orange-500/20
            transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="text-4xl font-bold text-orange-600 mb-3 tracking-tight">
              {avgScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Điểm trung bình
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 