export interface AutoApprovalRule {
  id: string
  name: string
  description?: string
  priority: number
  is_active: boolean
  organization_id: string
  created_at: string
  updated_at: string
  conditions?: RuleCondition[]
}

export interface RuleCondition {
  id: string
  rule_id: string
  type: ConditionType
  operator: ConditionOperator
  value: any // JSONB field
  created_at: string
}

export type ConditionType = 
  | 'CONTAINER_TYPE'
  | 'ALLOWED_TRUCKING_CO'
  | 'MAX_DISTANCE_KM'

export type ConditionOperator = 
  | 'IN'
  | 'EQUALS'
  | 'LESS_THAN_OR_EQUAL'

export interface CreateRuleFormData {
  name: string
  description?: string
  priority: number
  is_active: boolean
  conditions: {
    containerTypes: string[]
    allowedTruckingCos: string[]
    maxDistanceKm?: number
    applyToAllTruckingCos: boolean
    hasDistanceLimit: boolean
  }
}

export interface RuleConditionSummary {
  containerTypes?: string[]
  allowedCompanies?: string[]
  maxDistance?: number
}

// Utility type for the auto-approval result
export interface AutoApprovalResult {
  approved: boolean
  ruleId?: string
  ruleName?: string
} 