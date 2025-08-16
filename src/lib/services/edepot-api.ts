/**
 * eDepot API Workflow Service
 * Implements the 3-step authentication workflow from Postman collection:
 * 1. Login to get main token
 * 2. Get temporary request token (reqtoken) and request time (reqtime)
 * 3. Use reqtoken and reqtime to call actual API endpoints
 */

export interface EDepotApiLoginRequest {
  user: string
  password: string
}

export interface EDepotApiLoginResponse {
  token: string
  [key: string]: any
}

export interface EDepotApiTokenRequest {
  reqid: string
  data: {
    appversion: string
  }
}

export interface EDepotApiTokenResponse {
  token: string
  reqtime: string
  [key: string]: any
}

export interface EDepotApiDataRequest {
  token: string
  reqtime: string
  data: {
    appversion: string
    [key: string]: any
  }
}

export interface EDepotApiDataResponse {
  data: any[]
  [key: string]: any
}

export interface EDepotApiWorkflowResult {
  success: boolean
  data?: any
  error?: string
  tokens?: {
    mainToken: string
    reqToken: string
    reqTime: string
  }
}

class EDepotApiService {
  private readonly baseUrl = 'https://apiedepottest.gsotgroup.vn/api'
  private readonly timeout = 15000 // 15 seconds
  private readonly appVersion = '2023'

  /**
   * Step 1: Login to get main authentication token
   * @description Authenticates user and returns main token for subsequent requests
   * @param credentials User credentials (username and password)
   * @returns Login response with main token
   */
  async login(credentials: EDepotApiLoginRequest): Promise<EDepotApiLoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/Users/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.token) {
        throw new Error('No token received from login response')
      }

      return data
    } catch (error) {
      console.error('eDepot API Login Error:', error)
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Step 2: Get temporary request token and time
   * @description Uses main token to get temporary tokens for specific API calls
   * @param mainToken Main authentication token from login
   * @param reqid Request identifier (e.g., 'ViLTA_GetDefaultWallet')
   * @returns Temporary token and request time
   */
  async getRequestToken(
    mainToken: string,
    reqid: string = 'ViLTA_GetDefaultWallet'
  ): Promise<EDepotApiTokenResponse> {
    try {
      const requestBody: EDepotApiTokenRequest = {
        reqid,
        data: {
          appversion: this.appVersion,
        },
      }

      const response = await fetch(`${this.baseUrl}/data/util/gettokenNonAid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mainToken}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Get token failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.token || !data.reqtime) {
        throw new Error('No reqtoken or reqtime received from response')
      }

      return data
    } catch (error) {
      console.error('eDepot API Get Token Error:', error)
      throw new Error(`Get token failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Step 3: Call actual API endpoint with temporary tokens
   * @description Makes the actual API call using temporary tokens
   * @param mainToken Main authentication token
   * @param reqToken Temporary request token
   * @param reqTime Request time
   * @param endpoint API endpoint to call (e.g., 'ViLTA_GetDefaultWallet')
   * @param additionalData Additional data to send with request
   * @returns API response data
   */
  async callApiEndpoint(
    mainToken: string,
    reqToken: string,
    reqTime: string,
    endpoint: string = 'ViLTA_GetDefaultWallet',
    additionalData: Record<string, any> = {}
  ): Promise<EDepotApiDataResponse> {
    try {
      const requestBody: EDepotApiDataRequest = {
        token: reqToken,
        reqtime: reqTime,
        data: {
          appversion: this.appVersion,
          ...additionalData,
        },
      }

      const response = await fetch(`${this.baseUrl}/data/process/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mainToken}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('eDepot API Call Error:', error)
      throw new Error(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Complete workflow: Login -> Get Token -> Call API
   * @description Executes the complete 3-step workflow in sequence
   * @param credentials User credentials
   * @param endpoint API endpoint to call
   * @param additionalData Additional data for the API call
   * @returns Complete workflow result with data and tokens
   */
  async executeWorkflow(
    credentials: EDepotApiLoginRequest,
    endpoint: string = 'ViLTA_GetDefaultWallet',
    additionalData: Record<string, any> = {}
  ): Promise<EDepotApiWorkflowResult> {
    try {
      // Step 1: Login
      console.log('Step 1: Logging in...')
      const loginResponse = await this.login(credentials)
      const mainToken = loginResponse.token

      // Step 2: Get request token
      console.log('Step 2: Getting request token...')
      const tokenResponse = await this.getRequestToken(mainToken, endpoint)
      const reqToken = tokenResponse.token
      const reqTime = tokenResponse.reqtime

      // Step 3: Call API endpoint
      console.log('Step 3: Calling API endpoint...')
      const apiResponse = await this.callApiEndpoint(
        mainToken,
        reqToken,
        reqTime,
        endpoint,
        additionalData
      )

      return {
        success: true,
        data: apiResponse,
        tokens: {
          mainToken,
          reqToken,
          reqTime,
        },
      }
    } catch (error) {
      console.error('eDepot API Workflow Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown workflow error',
      }
    }
  }

  /**
   * Test connection to eDepot API
   * @description Tests if the API is accessible
   * @returns Connection test result
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/Users/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: 'test', password: 'test' }),
        signal: AbortSignal.timeout(5000),
      })

      // We expect this to fail with 401/400, but if we get a response, the API is accessible
      return {
        success: true,
        message: `API accessible - Status: ${response.status}`,
      }
    } catch (error) {
      return {
        success: false,
        message: `API not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
}

// Export singleton instance
export const eDepotApiService = new EDepotApiService()
export default eDepotApiService