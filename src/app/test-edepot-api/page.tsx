'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle, XCircle, Play, Settings, Database } from 'lucide-react'
import {
  testEDepotApiConnection,
  executeEDepotApiWorkflow,
  executeEDepotApiStep,
  getAvailableEDepotEndpoints,
} from '@/lib/actions/edepot-api'
import type { EDepotApiWorkflowResult } from '@/lib/services/edepot-api'

interface StepResult {
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

interface WorkflowState {
  step1: StepResult | null
  step2: StepResult | null
  step3: StepResult | null
  complete: StepResult | null
}

export default function TestEDepotApiPage() {
  // Connection test state
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success: boolean
    message: string
    loading: boolean
  }>({ tested: false, success: false, message: '', loading: false })

  // Form state
  const [credentials, setCredentials] = useState({
    user: '0000000009',
    password: '123456',
  })
  const [endpoint, setEndpoint] = useState('ViLTA_GetDefaultWallet')
  const [additionalData, setAdditionalData] = useState('{}')

  // Workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    step1: null,
    step2: null,
    step3: null,
    complete: null,
  })
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | null>(null)

  // Available endpoints
  const [endpoints, setEndpoints] = useState<Array<{
    name: string
    description: string
    endpoint: string
  }>>([])

  /**
   * Test API connection
   */
  const handleTestConnection = async () => {
    setConnectionStatus({ ...connectionStatus, loading: true })
    
    try {
      const result = await testEDepotApiConnection()
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.message,
        loading: false,
      })
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: `Connection test failed: ${error}`,
        loading: false,
      })
    }
  }

  /**
   * Load available endpoints
   */
  const loadEndpoints = async () => {
    try {
      const result = await getAvailableEDepotEndpoints()
      setEndpoints(result.endpoints)
    } catch (error) {
      console.error('Failed to load endpoints:', error)
    }
  }

  /**
   * Execute complete workflow
   */
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true)
    setCurrentStep(null)
    
    // Reset workflow state
    setWorkflowState({
      step1: null,
      step2: null,
      step3: null,
      complete: null,
    })

    try {
      let parsedAdditionalData = {}
      try {
        parsedAdditionalData = JSON.parse(additionalData)
      } catch {
        parsedAdditionalData = {}
      }

      const result = await executeEDepotApiWorkflow(
        credentials,
        endpoint,
        parsedAdditionalData
      )

      setWorkflowState(prev => ({
        ...prev,
        complete: {
          success: result.success,
          data: result.data,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      }))
    } catch (error) {
      setWorkflowState(prev => ({
        ...prev,
        complete: {
          success: false,
          error: `Workflow failed: ${error}`,
          timestamp: new Date().toISOString(),
        },
      }))
    } finally {
      setIsExecuting(false)
    }
  }

  /**
   * Execute individual step
   */
  const handleExecuteStep = async (step: 1 | 2 | 3) => {
    setCurrentStep(step)
    
    try {
      let params: any = {}
      
      switch (step) {
        case 1:
          params = { credentials }
          break
        case 2:
          if (!workflowState.step1?.data?.token) {
            alert('Please execute Step 1 first to get the main token')
            return
          }
          params = {
            mainToken: workflowState.step1.data.token,
            endpoint,
          }
          break
        case 3:
          if (!workflowState.step1?.data?.token || !workflowState.step2?.data?.token || !workflowState.step2?.data?.reqtime) {
            alert('Please execute Steps 1 and 2 first to get required tokens')
            return
          }
          let parsedAdditionalData = {}
          try {
            parsedAdditionalData = JSON.parse(additionalData)
          } catch {
            parsedAdditionalData = {}
          }
          params = {
            mainToken: workflowState.step1.data.token,
            reqToken: workflowState.step2.data.token,
            reqTime: workflowState.step2.data.reqtime,
            endpoint,
            additionalData: parsedAdditionalData,
          }
          break
      }

      const result = await executeEDepotApiStep(step, params)
      
      setWorkflowState(prev => ({
        ...prev,
        [`step${step}`]: {
          success: result.success,
          data: result.data,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      }))
    } catch (error) {
      setWorkflowState(prev => ({
        ...prev,
        [`step${step}`]: {
          success: false,
          error: `Step ${step} failed: ${error}`,
          timestamp: new Date().toISOString(),
        },
      }))
    } finally {
      setCurrentStep(null)
    }
  }

  /**
   * Render step result
   */
  const renderStepResult = (stepResult: StepResult | null, stepName: string) => {
    if (!stepResult) {
      return (
        <div className="text-sm text-muted-foreground">
          Not executed yet
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {stepResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={stepResult.success ? 'default' : 'destructive'}>
            {stepResult.success ? 'Success' : 'Failed'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(stepResult.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        {stepResult.error && (
          <Alert variant="destructive">
            <AlertDescription>{stepResult.error}</AlertDescription>
          </Alert>
        )}
        
        {stepResult.data && (
          <div className="mt-2">
            <Label className="text-xs font-medium">Response Data:</Label>
            <Textarea
              value={JSON.stringify(stepResult.data, null, 2)}
              readOnly
              className="mt-1 font-mono text-xs"
              rows={8}
            />
          </div>
        )}
      </div>
    )
  }

  // Load endpoints on component mount
  useEffect(() => {
    loadEndpoints()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h1 className="text-3xl font-bold">eDepot API Test Page</h1>
      </div>
      
      <p className="text-muted-foreground">
        Test the complete eDepot API workflow: Login → Get Token → Call API
      </p>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="workflow">Complete Workflow</TabsTrigger>
          <TabsTrigger value="steps">Individual Steps</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Connection Test Tab */}
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API Connection Test
              </CardTitle>
              <CardDescription>
                Test if the eDepot API is accessible and responding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={connectionStatus.loading}
                className="w-full"
              >
                {connectionStatus.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              {connectionStatus.tested && (
                <Alert variant={connectionStatus.success ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {connectionStatus.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{connectionStatus.message}</AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complete Workflow Tab */}
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Complete Workflow Execution
              </CardTitle>
              <CardDescription>
                Execute the complete 3-step workflow in one go
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleExecuteWorkflow} 
                disabled={isExecuting}
                className="w-full"
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing Workflow...
                  </>
                ) : (
                  'Execute Complete Workflow'
                )}
              </Button>
              
              {workflowState.complete && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Workflow Result:</Label>
                  {renderStepResult(workflowState.complete, 'Complete Workflow')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Steps Tab */}
        <TabsContent value="steps">
          <div className="grid gap-4">
            {/* Step 1: Login */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Login</CardTitle>
                <CardDescription>
                  Authenticate with eDepot API to get main token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExecuteStep(1)} 
                  disabled={currentStep === 1}
                  variant="outline"
                >
                  {currentStep === 1 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    'Execute Step 1: Login'
                  )}
                </Button>
                
                {renderStepResult(workflowState.step1, 'Step 1: Login')}
              </CardContent>
            </Card>

            {/* Step 2: Get Token */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Get Request Token</CardTitle>
                <CardDescription>
                  Get temporary request token and time using main token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExecuteStep(2)} 
                  disabled={currentStep === 2 || !workflowState.step1?.success}
                  variant="outline"
                >
                  {currentStep === 2 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    'Execute Step 2: Get Token'
                  )}
                </Button>
                
                {renderStepResult(workflowState.step2, 'Step 2: Get Token')}
              </CardContent>
            </Card>

            {/* Step 3: Call API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Call API Endpoint</CardTitle>
                <CardDescription>
                  Call the actual API endpoint using temporary tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExecuteStep(3)} 
                  disabled={currentStep === 3 || !workflowState.step2?.success}
                  variant="outline"
                >
                  {currentStep === 3 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    'Execute Step 3: Call API'
                  )}
                </Button>
                
                {renderStepResult(workflowState.step3, 'Step 3: Call API')}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure credentials and parameters for API testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={credentials.user}
                    onChange={(e) => setCredentials(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="Enter eDepot username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter eDepot password"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="Enter API endpoint"
                />
                {endpoints.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Available endpoints:
                    <div className="mt-1 space-y-1">
                      {endpoints.map((ep, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEndpoint(ep.endpoint)}
                            className="h-auto p-1 text-xs"
                          >
                            {ep.endpoint}
                          </Button>
                          <span className="text-xs">- {ep.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalData">Additional Data (JSON)</Label>
                <Textarea
                  id="additionalData"
                  value={additionalData}
                  onChange={(e) => setAdditionalData(e.target.value)}
                  placeholder='Enter additional data as JSON, e.g., {"key": "value"}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}