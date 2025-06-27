export function ScoreBadge({ score }: { score: number }) {
  const getScoreColor = () => {
    if (score >= 85) return 'bg-green-100 text-green-800 border-green-300'; // Xuất sắc
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300'; // Rất tốt
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Khá tốt
    if (score >= 30) return 'bg-orange-100 text-orange-800 border-orange-300'; // Phức tạp
    return 'bg-red-100 text-red-800 border-red-300'; // Cực kỳ phức tạp
  };

  const getScoreLabel = () => {
    if (score >= 85) return '⭐⭐⭐⭐⭐';
    if (score >= 70) return '⭐⭐⭐⭐';
    if (score >= 50) return '⭐⭐⭐';
    if (score >= 30) return '⭐⭐';
    return '⭐';
  };

  return (
    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 ${getScoreColor()}`}>
      <span className="text-xl font-bold">{Math.round(score)}</span>
      <span className="text-xs">{getScoreLabel()}</span>
    </div>
  );
} 