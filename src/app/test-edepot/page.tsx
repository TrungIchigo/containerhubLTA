'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { UserProfile } from '@/components/auth/UserProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { hybridAuthService } from '@/lib/services/hybrid-auth'
import { eDepotService } from '@/lib/services/edepot'
import { TestTube, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { LtaLoadingCompact } from '@/components/ui/ltaloading'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestEDepotPage() {
  const { user, isLoading } = useAuth()
  const [testCredentials, setTestCredentials] = useState({
    email: '',
    password: ''
  })
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  const runConnectivityTest = async () => {
    try {
      const response = await fetch('https://apiedepottest.gsotgroup.vn/api/Users/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'test@example.com',
          password: 'invalid'
        })
      })

      if (response.status === 401 || response.status === 400) {
        addTestResult({
          name: 'Kết nối eDepot API',
          status: 'success',
          message: 'API endpoint có thể truy cập được (trả về lỗi xác thực như mong đợi)'
        })
      } else {
        addTestResult({
          name: 'Kết nối eDepot API',
          status: 'warning',
          message: `API trả về status code bất thường: ${response.status}`
        })
      }
    } catch (error) {
      addTestResult({
        name: 'Kết nối eDepot API',
        status: 'error',
        message: `Không thể kết nối: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      })
    }
  }

  const runAuthenticationTest = async () => {
    if (!testCredentials.email || !testCredentials.password) {
      addTestResult({
        name: 'Test Authentication',
        status: 'error',
        message: 'Vui lòng nhập email và password để test'
      })
      return
    }

    try {
      const result = await hybridAuthService.authenticate(testCredentials)
      
      addTestResult({
        name: 'Hybrid Authentication',
        status: result.success ? 'success' : 'error',
        message: result.success 
          ? `Đăng nhập thành công từ ${result.source}` 
          : result.error || 'Đăng nhập thất bại',
        details: result
      })
    } catch (error) {
      addTestResult({
        name: 'Hybrid Authentication',
        status: 'error',
        message: `Lỗi trong quá trình test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      })
    }
  }

  const runDirectEDepotTest = async () => {
    if (!testCredentials.email || !testCredentials.password) {
      addTestResult({
        name: 'Direct eDepot Test',
        status: 'error',
        message: 'Vui lòng nhập email và password để test'
      })
      return
    }

    try {
      const result = await eDepotService.login({
        user: testCredentials.email,
        password: testCredentials.password
      })
      
      addTestResult({
        name: 'Direct eDepot Login',
        status: result.success ? 'success' : 'error',
        message: result.success 
          ? 'Kết nối trực tiếp eDepot thành công' 
          : result.error || 'Kết nối eDepot thất bại',
        details: result
      })
    } catch (error) {
      addTestResult({
        name: 'Direct eDepot Login',
        status: 'error',
        message: `Lỗi kết nối trực tiếp: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      })
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    clearTestResults()
    
    await runConnectivityTest()
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
    
    await runDirectEDepotTest()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await runAuthenticationTest()
    
    setIsRunningTests(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Thành công</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Lỗi</Badge>
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Cảnh báo</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TestTube className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Test eDepot Integration</h1>
          <p className="text-text-secondary">Kiểm tra tích hợp hệ thống với eDepot API</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current User Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Database className="w-5 h-5" />
            Thông tin người dùng hiện tại
          </h2>
          <UserProfile />
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Test Authentication</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Thông tin test</CardTitle>
              <CardDescription>
                Nhập thông tin đăng nhập để test kết nối eDepot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testCredentials.email}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-password">Password</Label>
                <Input
                  id="test-password"
                  type="password"
                  placeholder="••••••••"
                  value={testCredentials.password}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  className="flex-1"
                >
                  {isRunningTests ? (
                    <>
                      <LtaLoadingCompact className="w-4 h-4 mr-2" />
                      Đang test...
                    </>
                  ) : (
                    'Chạy tất cả test'
                  )}
                </Button>
                
                <Button
                  onClick={clearTestResults}
                  variant="outline"
                  disabled={isRunningTests}
                >
                  Xóa kết quả
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Kết quả test</h2>
          
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text-primary">{result.name}</h3>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-text-secondary text-sm">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-text-secondary cursor-pointer hover:text-primary">
                              Chi tiết kỹ thuật
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}