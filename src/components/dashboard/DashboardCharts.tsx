'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateVN } from '@/lib/utils'

interface TrendDataPoint {
  date: string
  approved: number
  declined: number
  pending: number
  total: number
}

interface StatusDistribution {
  approved: number
  declined: number
  pending: number
}

interface DashboardChartsProps {
  trendData: TrendDataPoint[]
  statusDistribution: StatusDistribution
  className?: string
}

const statusColors = {
  approved: '#4CAF50',  // primary green
  declined: '#F44336',  // danger red
  pending: '#FFC107'    // accent amber
}

const pieData = (distribution: StatusDistribution) => [
  { name: 'Đã duyệt', value: distribution.approved, color: statusColors.approved },
  { name: 'Bị từ chối', value: distribution.declined, color: statusColors.declined },
  { name: 'Đang chờ', value: distribution.pending, color: statusColors.pending }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-foreground border border-border rounded-md p-3 shadow-lg">
        <p className="text-body font-medium text-text-primary mb-2">
          {formatDateVN(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-body-small" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-foreground border border-border rounded-md p-3 shadow-lg">
        <p className="text-body font-medium text-text-primary">
          {data.name}: {data.value}
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardCharts({ 
  trendData, 
  statusDistribution, 
  className 
}: DashboardChartsProps) {
  const pieChartData = pieData(statusDistribution)
  const hasData = trendData && trendData.length > 0
  
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Line Chart - Trend Analysis */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-h3 font-semibold text-text-primary">
            Xu Hướng Tái Sử Dụng Container Theo Thời Gian
          </h3>
          <p className="text-body-small text-text-secondary">
            Theo dõi số lượng yêu cầu theo từng ngày
          </p>
        </div>
        
        <div className="h-80">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDateVN}
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke={statusColors.approved} 
                  strokeWidth={2}
                  name="Đã duyệt"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="declined" 
                  stroke={statusColors.declined} 
                  strokeWidth={2}
                  name="Bị từ chối"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke={statusColors.pending} 
                  strokeWidth={2}
                  name="Đang chờ"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-text-secondary">Không có dữ liệu để hiển thị</p>
            </div>
          )}
        </div>
      </div>

      {/* Pie Chart - Status Distribution */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-h3 font-semibold text-text-primary">
            Phân Bổ Yêu Cầu Theo Trạng Thái
          </h3>
          <p className="text-body-small text-text-secondary">
            Tỷ lệ phần trăm các loại trạng thái
          </p>
        </div>
        
        <div className="h-80">
          {pieChartData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-text-secondary">Không có dữ liệu để hiển thị</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 