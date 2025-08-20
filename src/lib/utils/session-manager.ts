'use client'

import type { AuthUser } from '@/hooks/useEDepotAuth'

interface SessionData {
  user: AuthUser | null
  timestamp: number
  expiresAt: number
}

const SESSION_KEY = 'containerhub_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Session Manager utility for handling authentication state persistence
 * Helps prevent unnecessary reloads and maintains user session across tab switches
 */
export class SessionManager {
  /**
   * Saves user session to localStorage with expiration
   * @param user - The authenticated user data
   */
  static saveSession(user: AuthUser | null): void {
    try {
      const sessionData: SessionData = {
        user,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
      }
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
      console.log('SessionManager: Session saved', { userId: user?.id, source: user?.source })
    } catch (error) {
      console.warn('SessionManager: Failed to save session:', error)
    }
  }

  /**
   * Retrieves user session from localStorage if valid
   * @returns The cached user data or null if expired/invalid
   */
  static getSession(): AuthUser | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null

      const sessionData: SessionData = JSON.parse(stored)
      
      // Check if session has expired
      if (Date.now() > sessionData.expiresAt) {
        console.log('SessionManager: Session expired, clearing')
        this.clearSession()
        return null
      }

      // Check if session is too old (older than 1 hour)
      const sessionAge = Date.now() - sessionData.timestamp
      if (sessionAge > 60 * 60 * 1000) {
        console.log('SessionManager: Session too old, needs refresh')
        return null
      }

      console.log('SessionManager: Valid session found', { 
        userId: sessionData.user?.id, 
        source: sessionData.user?.source,
        age: Math.round(sessionAge / 1000) + 's'
      })
      
      return sessionData.user
    } catch (error) {
      console.warn('SessionManager: Failed to retrieve session:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Clears the stored session data
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY)
      console.log('SessionManager: Session cleared')
    } catch (error) {
      console.warn('SessionManager: Failed to clear session:', error)
    }
  }

  /**
   * Checks if a session exists and is valid
   * @returns boolean indicating session validity
   */
  static hasValidSession(): boolean {
    return this.getSession() !== null
  }

  /**
   * Updates the session timestamp to extend its validity
   * @param user - The current user data
   */
  static refreshSession(user: AuthUser | null): void {
    if (user) {
      this.saveSession(user)
    }
  }

  /**
   * Gets session age in milliseconds
   * @returns Age of current session or 0 if no session
   */
  static getSessionAge(): number {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return 0

      const sessionData: SessionData = JSON.parse(stored)
      return Date.now() - sessionData.timestamp
    } catch (error) {
      return 0
    }
  }

  /**
   * Checks if session needs refresh based on age
   * @param maxAge - Maximum age in milliseconds before refresh needed
   * @returns boolean indicating if refresh is needed
   */
  static needsRefresh(maxAge: number = 30 * 60 * 1000): boolean {
    return this.getSessionAge() > maxAge
  }
}

export default SessionManager