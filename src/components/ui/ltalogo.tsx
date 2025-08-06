import React from 'react'

interface LtaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

/**
 * Logo LTA (Logistics Technology Application) component
 * Hiển thị logo với thiết kế đường cong xanh lá và các mạch điện tử
 */
export function LtaLogo({ className = '', size = 'md', animated = false }: LtaLogoProps) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  }

  return (
    <div className={`${sizes[size]} ${className} ${animated ? 'animate-pulse' : ''}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background oval shape - đường cong chính */}
        <path
          d="M20 50 Q20 25 50 25 Q80 25 80 50 Q80 75 50 75 Q20 75 20 50"
          stroke="#4CAF50"
          strokeWidth="3"
          fill="none"
          className="logo-oval"
        />
        
        {/* Top curve - đường cong trên */}
        <path
          d="M25 35 Q50 30 75 35"
          stroke="#4CAF50"
          strokeWidth="2.5"
          fill="none"
          className="logo-curve-top"
        />
        
        {/* Bottom curve - đường cong dưới */}
        <path
          d="M25 65 Q50 70 75 65"
          stroke="#4CAF50"
          strokeWidth="2.5"
          fill="none"
          className="logo-curve-bottom"
        />
        
        {/* Circuit lines - các đường mạch điện tử bên trái */}
        <g className="circuit-lines-left">
          <path
            d="M30 45 L35 40 L40 42"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="40" cy="42" r="1.5" fill="#66BB6A" className="circuit-dot" />
          
          <path
            d="M28 50 L33 48 L38 50"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="38" cy="50" r="1.5" fill="#66BB6A" className="circuit-dot" />
          
          <path
            d="M30 55 L35 53 L40 55"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="40" cy="55" r="1.5" fill="#66BB6A" className="circuit-dot" />
          
          <path
            d="M28 60 L33 58 L38 60"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="38" cy="60" r="1.5" fill="#66BB6A" className="circuit-dot" />
        </g>
        
        {/* Circuit lines - các đường mạch điện tử bên phải */}
        <g className="circuit-lines-right">
          <path
            d="M70 45 L65 40 L60 42"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="60" cy="42" r="1.5" fill="#66BB6A" className="circuit-dot" />
          
          <path
            d="M72 50 L67 48 L62 50"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="62" cy="50" r="1.5" fill="#66BB6A" className="circuit-dot" />
          
          <path
            d="M70 55 L65 53 L60 55"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="60" cy="55" r="1.5" fill="#66BB6A" className="circuit-dot" />
          
          <path
            d="M72 60 L67 58 L62 60"
            stroke="#66BB6A"
            strokeWidth="1.5"
            fill="none"
            className="circuit-line"
          />
          <circle cx="62" cy="60" r="1.5" fill="#66BB6A" className="circuit-dot" />
        </g>
        
        {/* Central connection lines - đường kết nối trung tâm */}
        <g className="central-connections">
          <path
            d="M45 40 L55 40"
            stroke="#81C784"
            strokeWidth="1"
            fill="none"
            className="connection-line"
          />
          <path
            d="M45 50 L55 50"
            stroke="#81C784"
            strokeWidth="1"
            fill="none"
            className="connection-line"
          />
          <path
            d="M45 60 L55 60"
            stroke="#81C784"
            strokeWidth="1"
            fill="none"
            className="connection-line"
          />
        </g>
      </svg>
    </div>
  )
}

export default LtaLogo 