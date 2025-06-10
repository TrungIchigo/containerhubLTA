import { RuleCondition, RuleConditionSummary } from '@/lib/types/auto-approval'

// Utility function to summarize rule conditions for display
export function summarizeRuleConditions(conditions: RuleCondition[]): RuleConditionSummary {
  const summary: RuleConditionSummary = {}

  conditions.forEach(condition => {
    switch (condition.type) {
      case 'CONTAINER_TYPE':
        summary.containerTypes = condition.value
        break
      case 'ALLOWED_TRUCKING_CO':
        summary.allowedCompanies = condition.value
        break
      case 'MAX_DISTANCE_KM':
        summary.maxDistance = condition.value[0]
        break
    }
  })

  return summary
} 