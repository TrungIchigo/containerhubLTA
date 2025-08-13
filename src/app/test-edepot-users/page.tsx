'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Users, LogIn, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { hybridAuthService } from '@/lib/services/hybrid-auth'
import type { EDepotUserData } from '@/lib/services/edepot'

interface TestResult {
  success: boolean
  message: string
  data?: any
}

export default function TestEDepotUsersPage() {
  const [loginData, setLoginData] = useState({
    username: '020202022',
    password: '098765'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginResult, setLoginResult] = useState<TestResult | null>(null)
  const [userChecks, setUserChecks] = useState<any[]>([])
  const [usersResult, setUsersResult] = useState<TestResult | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData(prev => ({ ...prev, [name]: value }))
  }

  const testLogin = async () => {
    setIsLoading(true)
    setLoginResult(null)
    
    try {
      // First check if user exists
      console.log('🔍 Checking if user exists...')
      const checkResponse = await fetch('/api/auth/edepot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkUser',
          username: loginData.username
        })
      })
      const checkResult = await checkResponse.json()
      console.log('User exists check:', checkResult)
      
      // Then test actual login
      console.log('🔐 Testing actual login...')
      const result = await hybridAuthService.authenticate({
        email: loginData.username, // Using username in email field
        password: loginData.password
      })

      if (result.success) {
        setLoginResult({
          success: true,
          message: `✅ CONSISTENT: User exists (${checkResult.exists}) and login successful with ${result.source}!`,
          data: {
            source: result.source,
            user: result.user || result.eDepotUser,
            redirectTo: result.redirectTo
          }
        })
      } else {
        // Analyze consistency between checkUser and login
        let consistencyMessage = ''
        if (checkResult.exists && result.error?.includes('không tồn tại')) {
          consistencyMessage = '❌ INCONSISTENT: User exists but login says user not found!'
        } else if (checkResult.exists && result.error?.includes('mật khẩu không đúng')) {
          consistencyMessage = '✅ CONSISTENT: User exists but wrong password'
        } else if (!checkResult.exists && result.error?.includes('không tồn tại')) {
          consistencyMessage = '✅ CONSISTENT: User does not exist and login failed appropriately'
        } else {
          consistencyMessage = `⚠️ UNCLEAR: User exists (${checkResult.exists}), login error: ${result.error}`
        }
        
        setLoginResult({
          success: false,
          message: `${consistencyMessage}\n\nLogin Error: ${result.error || 'Đăng nhập thất bại'}`,
          data: {
            source: result.source,
            requiresEDepotRegistration: result.requiresEDepotRegistration,
            userExists: checkResult.exists,
            loginError: result.error
          }
        })
      }
    } catch (error: any) {
      setLoginResult({
        success: false,
        message: `Lỗi: ${error.message}`,
        data: error
      })
    }
    
    setIsLoading(false)
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    setUsersResult(null)
    setUserChecks([])
    
    try {
      const response = await fetch('/api/edepot/users')
      const data = await response.json()

      if (data.success) {
        setUserChecks(data.userChecks || [])
        setUsersResult({
          success: true,
          message: data.message,
          data: data
        })
      } else {
        setUsersResult({
          success: false,
          message: data.error || 'Không thể kiểm tra tài khoản',
          data: data
        })
      }
    } catch (error: any) {
      setUsersResult({
        success: false,
        message: 'Lỗi kết nối API',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Test eDepot Authentication & User Check</h1>
        <p className="text-muted-foreground">
          Kiểm tra việc đăng nhập với username và kiểm tra tài khoản eDepot
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Login Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Test Login với Username
            </CardTitle>
            <CardDescription>
              Thử đăng nhập với username thay vì email format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleInputChange}
                placeholder="Nhập username (ví dụ: 020202022)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={testLogin} 
              disabled={isLoading || !loginData.username || !loginData.password}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Test Login
            </Button>

            {loginResult && (
              <Card className={loginResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {loginResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-medium ${loginResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {loginResult.message}
                    </span>
                  </div>
                  {loginResult.data && (
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(loginResult.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kiểm tra tài khoản eDepot
            </CardTitle>
            <CardDescription>
              Kiểm tra sự tồn tại của các tài khoản trong hệ thống eDepot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={fetchUsers} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Kiểm tra tài khoản eDepot
            </Button>

            {usersResult && (
              <Card className={usersResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {usersResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-medium ${usersResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {usersResult.message}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {userChecks.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-auto">
                <Separator />
                <h4 className="font-medium">Kết quả kiểm tra tài khoản eDepot ({userChecks.length}):</h4>
                {userChecks.map((check, index) => (
                  <Card key={index} className={`p-3 ${
                    check.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{check.username}</span>
                        <Badge variant={check.exists ? "default" : "destructive"}>
                          {check.exists ? "Tồn tại" : "Không tồn tại"}
                        </Badge>
                      </div>
                      <p className={`text-xs ${
                        check.exists ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {check.status}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. <strong>Test Login:</strong> Nhập username (không cần format email) và password để test đăng nhập</p>
          <p>2. <strong>Kiểm tra tài khoản:</strong> Click nút để kiểm tra sự tồn tại của các tài khoản eDepot</p>
          <p>3. <strong>Username mẫu:</strong> 020202022 / 098765</p>
          <p>4. Hệ thống sẽ tự động thử đăng nhập với eDepot nếu Supabase thất bại</p>
          <p>5. <strong>Lưu ý:</strong> API /Users trả về lỗi 500, nên sử dụng checkUserExists thay thế</p>
        </CardContent>
      </Card>
    </div>
  )
}