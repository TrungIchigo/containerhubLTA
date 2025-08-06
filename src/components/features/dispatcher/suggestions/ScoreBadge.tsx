'use client'

interface ScoreBadgeProps {
  score: number
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const getScoreColor = () => {
    if (score >= 75) return 'bg-green-100 text-green-800 border-green-300' // Xanh lá
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300' // Vàng
    return 'bg-red-100 text-red-800 border-red-300' // Đỏ
  }

  return (
    <div className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${getScoreColor()}`}>
      <span className="text-2xl font-bold">{Math.round(score)}</span>
    </div>
  )
}