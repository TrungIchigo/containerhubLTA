'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface GSAPAnimationsProps {
  children?: React.ReactNode
}

export default function GSAPAnimations({ children }: GSAPAnimationsProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const quoteRef = useRef<HTMLQuoteElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return

    let retryCount = 0
    const maxRetries = 10

    const startAnimations = () => {
      // Chỉ chạy animations trên desktop (lg và lớn hơn)
      const isDesktop = window.innerWidth >= 1024
      if (!isDesktop) {
        return
      }
      
      // Đảm bảo tất cả refs đã được mount
      if (!titleRef.current || !subtitleRef.current || !descriptionRef.current || !quoteRef.current || !statsRef.current) {
        retryCount++
        if (retryCount < maxRetries) {
          setTimeout(startAnimations, 200)
          return
        } else {
          return
        }
      }

      const tl = gsap.timeline({ delay: 0.5 })
      
      // Set initial states với null checks
      const elements = [titleRef.current, subtitleRef.current, descriptionRef.current, quoteRef.current, statsRef.current].filter(Boolean)
      
      // Force elements to be visible first
      elements.forEach(el => {
        if (el) {
          el.style.visibility = 'visible'
        }
      })
      
      gsap.set(elements, {
        opacity: 0,
        y: 50,
        scale: 0.8
      })

      // Animation sequence với dramatic effects
      if (titleRef.current) {
        tl.to(titleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "back.out(1.7)"
        })
        .to(titleRef.current, {
          textShadow: '0 0 30px rgba(76, 175, 80, 0.5)',
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.3")
      }

      if (subtitleRef.current) {
        tl.to(subtitleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.6")
        .to(subtitleRef.current, {
          color: '#4CAF50',
          textShadow: '0 0 20px rgba(76, 175, 80, 0.3)',
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.3")
      }

      if (descriptionRef.current) {
        tl.to(descriptionRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out"
        }, "-=0.4")
        .to(descriptionRef.current, {
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          duration: 0.3,
        }, "-=0.2")
      }

      if (quoteRef.current) {
        tl.to(quoteRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out"
        }, "-=0.3")
        .to(quoteRef.current, {
          borderLeftColor: '#4CAF50',
          boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
          duration: 0.5,
        }, "-=0.4")
      }

      if (statsRef.current) {
        tl.to(statsRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "back.out(1.2)"
        }, "-=0.2")
      }

      // Continuous dramatic animations
      if (titleRef.current) {
        gsap.to(titleRef.current, {
          textShadow: '0 0 40px rgba(76, 175, 80, 0.8), 0 0 60px rgba(76, 175, 80, 0.3)',
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut"
        })
      }

      // Enhanced floating animation for stats
      if (statsRef.current?.children) {
        gsap.to(Array.from(statsRef.current.children), {
          y: -15,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          stagger: 0.4
        })
        
        // Pulsing effect for numbers
        gsap.to(Array.from(statsRef.current.children).map(child => child.querySelector('.text-2xl')), {
          scale: 1.1,
          textShadow: '0 0 15px rgba(76, 175, 80, 0.6)',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          stagger: 0.3
        })
      }

      // Quote border animation
      if (quoteRef.current) {
        gsap.to(quoteRef.current, {
          borderLeftWidth: '6px',
          paddingLeft: '24px',
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut"
        })
      }
    }

    // Start animations with a small delay
    const timer = setTimeout(() => {
      startAnimations()
    }, 1000)

    // Cleanup
    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="relative z-20 flex flex-col items-center text-center">
      <h1 
        ref={titleRef}
        className="text-5xl font-bold tracking-tight bg-gradient-to-r from-secondary-foreground via-primary-light to-primary bg-clip-text text-transparent mb-2"
        style={{ opacity: 0 }}
      >
        i-ContainerHub
      </h1>
      <div 
        ref={subtitleRef}
        className="text-2xl font-semibold text-primary mb-6"
        style={{ opacity: 0 }}
      >
        @LTA
      </div>
      <p 
        ref={descriptionRef}
        className="text-xl text-secondary-foreground font-medium"
        style={{ opacity: 0 }}
      >
        Tối ưu container. Kết nối vận hành. Giảm chi phí.
      </p>
      <div className="mt-12 max-w-lg">
        <blockquote 
          ref={quoteRef}
          className="border-l-4 border-primary pl-6 italic text-lg text-secondary-foreground leading-relaxed"
          style={{ opacity: 0 }}
        >
          "Biến mỗi container rỗng thành một cơ hội, giảm thiểu chi phí và xây dựng chuỗi cung ứng bền vững."
        </blockquote>
        <div 
          ref={statsRef}
          className="mt-8 flex items-center justify-center space-x-8 text-sm text-secondary-light"
          style={{ opacity: 0 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">40%</div>
            <div>Tiết kiệm chi phí</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">50+</div>
            <div>Đối tác tin cậy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">24/7</div>
            <div>Hỗ trợ liên tục</div>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
} 