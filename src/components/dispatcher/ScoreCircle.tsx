interface ScoreCircleProps {
  score: number
}

export default function ScoreCircle({ score }: ScoreCircleProps) {
  let color = 'bg-red-100 text-red-600'
  if (score >= 85) color = 'bg-green-100 text-green-600'
  else if (score >= 70) color = 'bg-blue-100 text-blue-600'
  else if (score >= 50) color = 'bg-yellow-100 text-yellow-600'

  return (
    <div className={`rounded-full w-12 h-12 flex items-center justify-center ${color} font-semibold`}>
      {Math.round(score)}
    </div>
  )
} 