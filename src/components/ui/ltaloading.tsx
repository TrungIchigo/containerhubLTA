'use client'

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { LtaLogo } from './ltalogo'

interface LtaLoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'fullscreen' | 'inline'
  showText?: boolean
}

/**
 * Loading component sử dụng logo LTA với animation GSAP
 * Thay thế cho các loading spinner thông thường
 */
export function LtaLoading({ 
  text = 'Đang xử lý...', 
  size = 'lg', 
  className = '',
  variant = 'default',
  showText = true
}: LtaLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // GSAP Timeline cho animation
    const tl = gsap.timeline({ repeat: -1 })

    // Animation cho logo
    const logo = logoRef.current
    if (logo) {
      // Reset trạng thái ban đầu
      gsap.set(logo, { 
        scale: 0.8, 
        opacity: 0.7,
        rotation: 0 
      })

      // Animation chính cho logo
      tl.to(logo, {
        scale: 1.1,
        opacity: 1,
        duration: 1.5,
        ease: "power2.out"
      })
      .to(logo, {
        scale: 0.9,
        opacity: 0.8,
        duration: 1.5,
        ease: "power2.in"
      }, "-=1")

      // Animation xoay nhẹ
      tl.to(logo, {
        rotation: 5,
        duration: 2,
        ease: "power1.inOut"
      }, 0)
      .to(logo, {
        rotation: -5,
        duration: 2,
        ease: "power1.inOut"
      }, 2)
      .to(logo, {
        rotation: 0,
        duration: 2,
        ease: "power1.inOut"
      }, 4)
    }

    // Animation cho text
    const textElement = textRef.current
    if (textElement && showText) {
      gsap.set(textElement, { opacity: 0, y: 10 })
      
      tl.to(textElement, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, 0.5)
    }

    // Animation cho dots
    const dotsElement = dotsRef.current
    if (dotsElement && showText) {
      gsap.set(dotsElement, { opacity: 0 })
      
      tl.to(dotsElement, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      }, 1)
      .to(dotsElement, {
        scale: 1.2,
        duration: 0.3,
        ease: "power2.inOut"
      }, 1.5)
      .to(dotsElement, {
        scale: 1,
        duration: 0.3,
        ease: "power2.inOut"
      }, 1.8)
    }

    // Animation cho các phần tử con của logo (nếu có)
    const circuitLines = logo?.querySelectorAll('.circuit-line')
    const circuitDots = logo?.querySelectorAll('.circuit-dot')
    const connectionLines = logo?.querySelectorAll('.connection-line')

    if (circuitLines && circuitLines.length > 0) {
      gsap.set(circuitLines, { strokeDasharray: "0 100", opacity: 0.3 })
      
      tl.to(circuitLines, {
        strokeDasharray: "100 0",
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: "power2.out"
      }, 0.2)
    }

    if (circuitDots && circuitDots.length > 0) {
      gsap.set(circuitDots, { scale: 0, opacity: 0 })
      
      tl.to(circuitDots, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: "back.out(1.7)"
      }, 0.5)
    }

    if (connectionLines && connectionLines.length > 0) {
      gsap.set(connectionLines, { strokeDasharray: "0 100", opacity: 0.5 })
      
      tl.to(connectionLines, {
        strokeDasharray: "100 0",
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      }, 0.8)
    }

    return () => {
      tl.kill()
    }
  }, [showText])

  // CSS classes dựa trên variant
  const getContainerClasses = () => {
    const baseClasses = "flex flex-col items-center justify-center"
    
    switch (variant) {
      case 'fullscreen':
        return `${baseClasses} fixed inset-0 bg-white/95 backdrop-blur-sm z-50`
      case 'inline':
        return `${baseClasses} w-full h-full`
      default:
        return `${baseClasses} py-8`
    }
  }

  return (
    <div ref={containerRef} className={`${getContainerClasses()} ${className}`}>
      {/* Logo với animation */}
      <div ref={logoRef} className="mb-4">
        <LtaLogo size={size} />
      </div>

      {/* Text với animation */}
      {showText && (
        <div className="text-center">
          <p 
            ref={textRef}
            className="text-lg font-medium text-gray-700 mb-2"
          >
            {text}
          </p>
          
          {/* Animated dots */}
          <div 
            ref={dotsRef}
            className="flex justify-center space-x-1"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Loading component cho các trường hợp cụ thể
 */
export function LtaLoadingFullscreen({ text = 'Đang xác thực...' }: { text?: string }) {
  return (
    <LtaLoading 
      text={text}
      size="xl"
      variant="fullscreen"
      showText={true}
    />
  )
}

export function LtaLoadingInline({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <LtaLoading 
      text={text}
      size="md"
      variant="inline"
      showText={true}
    />
  )
}

export function LtaLoadingCompact({ text = 'Đang xử lý...' }: { text?: string }) {
  return (
    <LtaLoading 
      text={text}
      size="sm"
      variant="default"
      showText={false}
    />
  )
}

export default LtaLoading 