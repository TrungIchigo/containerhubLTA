'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { getPrepaidFund, generateCodPaymentQR, getDebugPrepaidFund, generateDebugCodPaymentQR, type PrepaidFund } from '@/lib/actions/fund'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function DebugFundPage() {
  const [prepaidFund, setPrepaidFund] = useState<PrepaidFund | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrResult, setQrResult] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  
  const { user, loading: userLoading } = useUser()
  
  // Override organization_id for debug purposes - using org with existing prepaid fund
  const debugOrgId = '779ddc11-2470-4e37-93d5-728cff6613cd' // Hapag-Lloyd Vietnam
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }
  
  const testGetPrepaidFund = async () => {
    setLoading(true)
    setError(null)
    addLog('🔄 Testing getDebugPrepaidFund...')
    
    try {
      const result = await getDebugPrepaidFund(debugOrgId)
      
      if (result.success) {
        setPrepaidFund(result.data)
        addLog(`✅ getDebugPrepaidFund success: ${result.data?.fund_code}`)
      } else {
        setError(result.error || result.message || 'Unknown error')
        addLog(`❌ getDebugPrepaidFund failed: ${result.error || result.message}`)
      }
    } catch (err: any) {
      setError(err.message)
      addLog(`❌ getDebugPrepaidFund exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const testGenerateQR = async () => {
    if (!prepaidFund) {
      addLog('❌ No prepaid fund available for QR generation')
      return
    }
    
    setLoading(true)
    addLog('🔄 Testing generateDebugCodPaymentQR...')
    
    try {
      const result = await generateDebugCodPaymentQR(
        debugOrgId,
        100000, // 100k VND
        '00000000-0000-0000-0000-000000000000' // fake cod request id
      )
      
      if (result.success) {
        setQrResult(result.data)
        addLog(`✅ generateDebugCodPaymentQR success`)
      } else {
        addLog(`❌ generateDebugCodPaymentQR failed: ${result.error || result.message}`)
      }
    } catch (err: any) {
      addLog(`❌ generateDebugCodPaymentQR exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (user) {
      addLog(`👤 User loaded: ${user.email}`)
      addLog(`🏢 Organization ID: ${user.profile?.organization_id || 'NULL'}`)
      addLog(`👔 Role: ${user.profile?.role || 'NULL'}`)
    }
  }, [user])
  
  if (userLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading user...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Debug Prepaid Fund System</h1>
        <p className="text-muted-foreground">Test và debug các vấn đề với prepaid fund</p>
      </div>
      
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👤 User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>User ID:</strong> {user.id}</div>
              <div className="flex items-center gap-2">
                <strong>Organization ID:</strong> 
                {user.profile?.organization_id ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {user.profile.organization_id}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    NULL (This is the problem!)
                  </span>
                )}
              </div>
              <div><strong>Debug Org ID:</strong> {debugOrgId} (Hapag-Lloyd Vietnam)</div>
              <div><strong>Role:</strong> {user.profile?.role || 'NULL'}</div>
            </div>
          ) : (
            <div className="text-red-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              No user logged in
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testGetPrepaidFund} 
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Test getPrepaidFund()
          </Button>
          
          <Button 
            onClick={testGenerateQR} 
            disabled={loading || !prepaidFund}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Test generateCodPaymentQR()
          </Button>
        </CardContent>
      </Card>
      
      {/* Results */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {prepaidFund && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Prepaid Fund Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Fund Code:</strong> {prepaidFund.fund_code}</div>
              <div><strong>Fund Name:</strong> {prepaidFund.fund_name}</div>
              <div><strong>Balance:</strong> {prepaidFund.balance.toLocaleString('vi-VN')} VNĐ</div>
              <div><strong>Currency:</strong> {prepaidFund.currency}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {qrResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">QR Code Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-white p-3 rounded border overflow-auto">
              {JSON.stringify(qrResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      
      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}