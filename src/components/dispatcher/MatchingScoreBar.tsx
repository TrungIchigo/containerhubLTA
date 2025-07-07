interface MatchingScoreBarProps {
  score: number
  maxScore: number
  color: string
}

export default function MatchingScoreBar({ score, maxScore, color }: MatchingScoreBarProps) {
  const percentage = (score / maxScore) * 100
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="w-32 bg-gray-200 rounded-full h-2">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 min-w-[60px]">
        {score.toFixed(1)}/{maxScore}
      </span>
    </div>
  )
} 