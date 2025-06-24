'use client'

import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Refs cho GSAP animations trên video background
  const videoContentRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const quoteRef = useRef<HTMLQuoteElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  // GSAP Animations cho video background text
  useLayoutEffect(() => {
    // Chỉ chạy animations trên desktop (lg và lớn hơn)
    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop) {
      console.log('Skipping video animations on mobile')
      return
    }

    let retryCount = 0
    const maxRetries = 10

    const startAnimations = () => {
      console.log(`Attempt ${retryCount + 1}/${maxRetries} - Checking refs:`, {
        titleRef: !!titleRef.current,
        subtitleRef: !!subtitleRef.current,
        descriptionRef: !!descriptionRef.current,
        quoteRef: !!quoteRef.current,
        statsRef: !!statsRef.current
      })
      
      // Đảm bảo tất cả refs đã được mount
      if (!titleRef.current || !subtitleRef.current || !descriptionRef.current || !quoteRef.current || !statsRef.current) {
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`Some refs not ready for video animations, retrying... (${retryCount}/${maxRetries})`)
          setTimeout(startAnimations, 200)
          return
        } else {
          console.log('Max retries reached, animations aborted')
          return
        }
      }
      
      console.log('All refs ready - Starting video text animations!')

      const tl = gsap.timeline({ delay: 0.5 })
      
      // Set initial states với null checks
      const elements = [titleRef.current, subtitleRef.current, descriptionRef.current, quoteRef.current, statsRef.current].filter(Boolean)
      
      console.log('Found elements:', elements.length)
      
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
        console.log('Animating title...')
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
        console.log('Animating subtitle...')
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
        console.log('Animating description...')
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
        console.log('Animating quote...')
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
        console.log('Animating stats...')
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
      console.log('Starting animation setup...')
      startAnimations()
    }, 100)

    // Cleanup
    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <AuthGuard requireAuth={false}>
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Cột Bên Trái - Form với GSAP Animations - children render trực tiếp */}
        {children}
        
        {/* Cột Bên Phải - Visual Branding với Video Background */}
        <div className="relative hidden lg:flex flex-col items-center justify-center bg-secondary-dark text-secondary-foreground p-10">
          {/* Video Nền */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          >
            <source src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logistics-background.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Lớp Phủ Màu theo Design System */}
          <div className="absolute top-0 left-0 w-full h-full bg-secondary-dark opacity-80 z-10"></div>
          
          {/* Nội dung trên lớp phủ với GSAP animations */}
          <div ref={videoContentRef} className="relative z-20 flex flex-col items-center text-center">
            <h1 
              ref={titleRef}
              className="text-5xl font-bold tracking-tight bg-gradient-to-r from-secondary-foreground via-primary-light to-primary bg-clip-text text-transparent mb-2"
            >
              i-ContainerHub
            </h1>
            <div 
              ref={subtitleRef}
              className="text-2xl font-semibold text-primary mb-6"
            >
              @LTA
            </div>
            <p 
              ref={descriptionRef}
              className="text-xl text-secondary-foreground font-medium"
            >
              Tối ưu container. Kết nối vận hành. Giảm chi phí.
            </p>
            <div className="mt-12 max-w-lg">
              <blockquote 
                ref={quoteRef}
                className="border-l-4 border-primary pl-6 italic text-lg text-secondary-foreground leading-relaxed"
              >
                "Biến mỗi container rỗng thành một cơ hội, giảm thiểu chi phí và xây dựng chuỗi cung ứng bền vững."
              </blockquote>
              <div 
                ref={statsRef}
                className="mt-8 flex items-center justify-center space-x-8 text-sm text-secondary-light"
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
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 