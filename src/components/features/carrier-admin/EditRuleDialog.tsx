'use client'

import { AutoApprovalRule } from '@/lib/types/auto-approval'

interface EditRuleDialogProps {
  children: React.ReactNode
  rule: AutoApprovalRule
}

export default function EditRuleDialog({ children, rule }: EditRuleDialogProps) {
  // Placeholder for now - will implement similar to CreateRuleDialog but with edit functionality
  return (
    <div>
      {children}
    </div>
  )
} 