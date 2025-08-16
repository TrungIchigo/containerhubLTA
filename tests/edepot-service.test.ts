/**
 * Unit tests for eDepot Service
 * @description Comprehensive tests for eDepot authentication and user management
 * @author i-ContainerHub Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { eDepotService } from '@/lib/services/edepot'
import type { EDepotLoginRequest, EDepotLoginResponse, EDepotUserData } from '@/lib/services/edepot'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock environment variables
process.env.EDEPOT_API_BASE_URL = 'https://api.edepot.test'
process.env.EDEPOT_API_TIMEOUT = '30000'

describe('EDepotService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    const validLoginRequest: EDepotLoginRequest = {
      user: 'testuser123',
      password: 'testpass456'
    }

    const mockSuccessResponse: EDepotLoginResponse = {
      success: true,
      token: 'mock-jwt-token-12345',
      user: {
        id: 'user123',
        fullName: 'Test User',
        email: 'test@example.com',
        organizationName: 'Test Organization'
      }
    }

    it('should return success response when credentials are valid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse
      })

      const result = await eDepotService.login(validLoginRequest)

      expect(result.success).toBe(true)
      expect(result.token).toBe('mock-jwt-token-12345')
      expect(result.user).toEqual(mockSuccessResponse.user)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(validLoginRequest)
        })
      )
    })

    it('should return error when credentials are invalid (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const result = await eDepotService.login(validLoginRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Thông tin đăng nhập không chính xác')
      expect(result.token).toBeUndefined()
      expect(result.user).toBeUndefined()
    })

    it('should return error when user not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await eDepotService.login(validLoginRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Người dùng không tồn tại trong hệ thống eDepot')
    })

    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      const result = await eDepotService.login(validLoginRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })

    it('should handle server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await eDepotService.login(validLoginRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Lỗi hệ thống eDepot. Vui lòng thử lại sau.')
    })

    it('should validate required fields', async () => {
      const invalidRequest = { user: '', password: 'test' } as EDepotLoginRequest
      
      const result = await eDepotService.login(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Vui lòng điền đầy đủ thông tin')
    })

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON') }
      })

      const result = await eDepotService.login(validLoginRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Phản hồi từ eDepot không hợp lệ')
    })
  })

  describe('getUserData', () => {
    const mockToken = 'bearer-token-123'
    const mockUserId = 'user123'
    const mockUserData: EDepotUserData = {
      id: 'user123',
      fullName: 'Test User',
      email: 'test@example.com',
      organizationName: 'Test Organization',
      role: 'DISPATCHER',
      permissions: ['READ_CONTAINERS', 'WRITE_REQUESTS']
    }

    it('should return user data when token and userId are valid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockUserData })
      })

      const result = await eDepotService.getUserData(mockToken, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUserData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/users/${mockUserId}`),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should return error when token is invalid (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const result = await eDepotService.getUserData(mockToken, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token không hợp lệ hoặc đã hết hạn')
    })

    it('should return error when user not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await eDepotService.getUserData(mockToken, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Không tìm thấy thông tin người dùng')
    })

    it('should handle missing parameters', async () => {
      const result1 = await eDepotService.getUserData('', mockUserId)
      const result2 = await eDepotService.getUserData(mockToken, '')

      expect(result1.success).toBe(false)
      expect(result1.error).toContain('Token và User ID là bắt buộc')
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('Token và User ID là bắt buộc')
    })
  })

  describe('checkUserExists', () => {
    const mockUsername = 'testuser123'

    it('should return true when user exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ exists: true })
      })

      const result = await eDepotService.checkUserExists(mockUsername)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/users/check/${mockUsername}`),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should return false when user does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ exists: false })
      })

      const result = await eDepotService.checkUserExists(mockUsername)

      expect(result).toBe(false)
    })

    it('should return false when API returns 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await eDepotService.checkUserExists(mockUsername)

      expect(result).toBe(false)
    })

    it('should return false when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await eDepotService.checkUserExists(mockUsername)

      expect(result).toBe(false)
    })

    it('should handle empty username', async () => {
      const result = await eDepotService.checkUserExists('')

      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle undefined environment variables gracefully', async () => {
      const originalBaseUrl = process.env.EDEPOT_API_BASE_URL
      delete process.env.EDEPOT_API_BASE_URL

      const result = await eDepotService.login({ user: 'test', password: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cấu hình API không hợp lệ')

      // Restore environment variable
      process.env.EDEPOT_API_BASE_URL = originalBaseUrl
    })

    it('should handle very long response times', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, token: 'test' })
          }), 35000) // Longer than timeout
        )
      )

      const result = await eDepotService.login({ user: 'test', password: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    }, 40000)

    it('should handle special characters in credentials', async () => {
      const specialCharsRequest: EDepotLoginRequest = {
        user: 'test@user#123',
        password: 'p@ssw0rd!@#$%^&*()'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, token: 'test-token' })
      })

      const result = await eDepotService.login(specialCharsRequest)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(specialCharsRequest)
        })
      )
    })
  })
})