'use server'

import { eDepotApiService } from '@/lib/services/edepot-api'
import type {
  EDepotApiLoginRequest,
  EDepotApiWorkflowResult,
} from '@/lib/services/edepot-api'

/**
 * Server Action to test eDepot API connection
 * @description Tests if the eDepot API is accessible
 * @returns Connection test result
 */
export async function testEDepotApiConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const result = await eDepotApiService.testConnection()
    return result
  } catch (error) {
    console.error('Test connection error:', error)
    return {
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Server Action to execute complete eDepot API workflow
 * @description Executes login -> get token -> call API workflow
 * @param credentials User credentials for eDepot
 * @param endpoint API endpoint to call (default: 'ViLTA_GetDefaultWallet')
 * @param additionalData Additional data to send with the API call
 * @returns Complete workflow result
 */
export async function executeEDepotApiWorkflow(
  credentials: EDepotApiLoginRequest,
  endpoint: string = 'ViLTA_GetDefaultWallet',
  additionalData: Record<string, any> = {}
): Promise<EDepotApiWorkflowResult> {
  try {
    // Validate input
    if (!credentials.user || !credentials.password) {
      return {
        success: false,
        error: 'Username and password are required',
      }
    }

    // Execute the complete workflow
    const result = await eDepotApiService.executeWorkflow(
      credentials,
      endpoint,
      additionalData
    )

    return result
  } catch (error) {
    console.error('Execute workflow error:', error)
    return {
      success: false,
      error: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Server Action to execute individual workflow steps
 * @description Allows testing individual steps of the workflow
 * @param step Which step to execute (1: login, 2: getToken, 3: callApi)
 * @param credentials User credentials (required for step 1)
 * @param mainToken Main token (required for steps 2 and 3)
 * @param reqToken Request token (required for step 3)
 * @param reqTime Request time (required for step 3)
 * @param endpoint API endpoint (for steps 2 and 3)
 * @param additionalData Additional data (for step 3)
 * @returns Step execution result
 */
export async function executeEDepotApiStep(
  step: 1 | 2 | 3,
  params: {
    credentials?: EDepotApiLoginRequest
    mainToken?: string
    reqToken?: string
    reqTime?: string
    endpoint?: string
    additionalData?: Record<string, any>
  }
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    switch (step) {
      case 1: {
        // Step 1: Login
        if (!params.credentials) {
          return { success: false, error: 'Credentials required for login step' }
        }
        
        const loginResult = await eDepotApiService.login(params.credentials)
        return { success: true, data: loginResult }
      }

      case 2: {
        // Step 2: Get Token
        if (!params.mainToken) {
          return { success: false, error: 'Main token required for get token step' }
        }
        
        const tokenResult = await eDepotApiService.getRequestToken(
          params.mainToken,
          params.endpoint || 'ViLTA_GetDefaultWallet'
        )
        return { success: true, data: tokenResult }
      }

      case 3: {
        // Step 3: Call API
        if (!params.mainToken || !params.reqToken || !params.reqTime) {
          return {
            success: false,
            error: 'Main token, request token, and request time required for API call step',
          }
        }
        
        const apiResult = await eDepotApiService.callApiEndpoint(
          params.mainToken,
          params.reqToken,
          params.reqTime,
          params.endpoint || 'ViLTA_GetDefaultWallet',
          params.additionalData || {}
        )
        return { success: true, data: apiResult }
      }

      default:
        return { success: false, error: 'Invalid step number. Must be 1, 2, or 3.' }
    }
  } catch (error) {
    console.error(`Execute step ${step} error:`, error)
    return {
      success: false,
      error: `Step ${step} execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Server Action to get available API endpoints
 * @description Returns list of known API endpoints for testing
 * @returns List of available endpoints
 */
export async function getAvailableEDepotEndpoints(): Promise<{
  endpoints: Array<{
    name: string
    description: string
    endpoint: string
  }>
}> {
  return {
    endpoints: [
      {
        name: 'Get Default Wallet',
        description: 'Retrieves default wallet information for the user',
        endpoint: 'ViLTA_GetDefaultWallet',
      },
      // Add more endpoints as they become available
      {
        name: 'Custom Endpoint',
        description: 'Custom endpoint for testing',
        endpoint: 'Custom_Endpoint',
      },
    ],
  }
}