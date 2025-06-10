'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { 
  AutoApprovalRule, 
  RuleCondition, 
  CreateRuleFormData,
  RuleConditionSummary 
} from '@/lib/types/auto-approval'

// Get all auto approval rules for the current carrier admin
export async function getAutoApprovalRules(): Promise<AutoApprovalRule[]> {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { data: rules, error } = await supabase
    .from('auto_approval_rules')
    .select(`
      *,
      conditions:rule_conditions(*)
    `)
    .eq('organization_id', user.profile.organization_id)
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching auto approval rules:', error)
    throw new Error('Failed to fetch auto approval rules')
  }

  return rules || []
}

// Create a new auto approval rule
export async function createAutoApprovalRule(formData: CreateRuleFormData) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  // Start a transaction by creating the rule first
  const { data: rule, error: ruleError } = await supabase
    .from('auto_approval_rules')
    .insert({
      name: formData.name,
      description: formData.description,
      priority: formData.priority,
      is_active: formData.is_active,
      organization_id: user.profile.organization_id
    })
    .select()
    .single()

  if (ruleError) {
    console.error('Error creating rule:', ruleError)
    throw new Error('Failed to create rule')
  }

  // Create conditions
  const conditions = []

  // Container type condition
  if (formData.conditions.containerTypes.length > 0) {
    conditions.push({
      rule_id: rule.id,
      type: 'CONTAINER_TYPE',
      operator: 'IN',
      value: formData.conditions.containerTypes
    })
  }

  // Trucking company condition
  if (!formData.conditions.applyToAllTruckingCos && formData.conditions.allowedTruckingCos.length > 0) {
    conditions.push({
      rule_id: rule.id,
      type: 'ALLOWED_TRUCKING_CO',
      operator: 'IN',
      value: formData.conditions.allowedTruckingCos
    })
  }

  // Distance condition
  if (formData.conditions.hasDistanceLimit && formData.conditions.maxDistanceKm !== undefined) {
    conditions.push({
      rule_id: rule.id,
      type: 'MAX_DISTANCE_KM',
      operator: 'LESS_THAN_OR_EQUAL',
      value: [formData.conditions.maxDistanceKm]
    })
  }

  // Insert all conditions
  if (conditions.length > 0) {
    const { error: conditionsError } = await supabase
      .from('rule_conditions')
      .insert(conditions)

    if (conditionsError) {
      console.error('Error creating conditions:', conditionsError)
      // Cleanup: delete the rule if conditions failed
      await supabase.from('auto_approval_rules').delete().eq('id', rule.id)
      throw new Error('Failed to create rule conditions')
    }
  }

  revalidatePath('/carrier-admin/rules')
  return rule
}

// Update auto approval rule
export async function updateAutoApprovalRule(ruleId: string, formData: CreateRuleFormData) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  // Update the rule
  const { error: ruleError } = await supabase
    .from('auto_approval_rules')
    .update({
      name: formData.name,
      description: formData.description,
      priority: formData.priority,
      is_active: formData.is_active
    })
    .eq('id', ruleId)
    .eq('organization_id', user.profile.organization_id)

  if (ruleError) {
    console.error('Error updating rule:', ruleError)
    throw new Error('Failed to update rule')
  }

  // Delete existing conditions
  const { error: deleteError } = await supabase
    .from('rule_conditions')
    .delete()
    .eq('rule_id', ruleId)

  if (deleteError) {
    console.error('Error deleting old conditions:', deleteError)
    throw new Error('Failed to update rule conditions')
  }

  // Create new conditions (same logic as create)
  const conditions = []

  if (formData.conditions.containerTypes.length > 0) {
    conditions.push({
      rule_id: ruleId,
      type: 'CONTAINER_TYPE',
      operator: 'IN',
      value: formData.conditions.containerTypes
    })
  }

  if (!formData.conditions.applyToAllTruckingCos && formData.conditions.allowedTruckingCos.length > 0) {
    conditions.push({
      rule_id: ruleId,
      type: 'ALLOWED_TRUCKING_CO',
      operator: 'IN',
      value: formData.conditions.allowedTruckingCos
    })
  }

  if (formData.conditions.hasDistanceLimit && formData.conditions.maxDistanceKm !== undefined) {
    conditions.push({
      rule_id: ruleId,
      type: 'MAX_DISTANCE_KM',
      operator: 'LESS_THAN_OR_EQUAL',
      value: [formData.conditions.maxDistanceKm]
    })
  }

  if (conditions.length > 0) {
    const { error: conditionsError } = await supabase
      .from('rule_conditions')
      .insert(conditions)

    if (conditionsError) {
      console.error('Error creating new conditions:', conditionsError)
      throw new Error('Failed to update rule conditions')
    }
  }

  revalidatePath('/carrier-admin/rules')
}

// Toggle rule active status
export async function toggleRuleStatus(ruleId: string, newStatus: boolean) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('auto_approval_rules')
    .update({ is_active: newStatus })
    .eq('id', ruleId)
    .eq('organization_id', user.profile.organization_id)

  if (error) {
    console.error('Error toggling rule status:', error)
    throw new Error('Failed to update rule status')
  }

  revalidatePath('/carrier-admin/rules')
}

// Delete auto approval rule
export async function deleteAutoApprovalRule(ruleId: string) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('auto_approval_rules')
    .delete()
    .eq('id', ruleId)
    .eq('organization_id', user.profile.organization_id)

  if (error) {
    console.error('Error deleting rule:', error)
    throw new Error('Failed to delete rule')
  }

  revalidatePath('/carrier-admin/rules')
}

// Get all organizations for condition setup
export async function getTruckingCompanies() {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('type', 'TRUCKING_COMPANY')
    .order('name')

  if (error) {
    console.error('Error fetching trucking companies:', error)
    throw new Error('Failed to fetch trucking companies')
  }

  return companies || []
}

 