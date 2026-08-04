import type { Contract, ContractValidityClassification } from '../types/contract'

export interface ContractValidity {
  classification: ContractValidityClassification
  label: string
  daysRemaining: number
}

const DAY = 86_400_000

export function getContractValidity(contract: Contract, now: Date = new Date()): ContractValidity {
  const effective = new Date(contract.effectiveDate)
  const expiration = new Date(contract.expirationDate)
  if (Number.isNaN(effective.getTime()) || Number.isNaN(expiration.getTime())) return { classification: 'Expired', label: 'Invalid contract dates', daysRemaining: 0 }

  if (now.getTime() < effective.getTime()) {
    const days = Math.max(1, Math.ceil((effective.getTime() - now.getTime()) / DAY))
    return { classification: 'Upcoming', label: `Starts in ${days} day${days === 1 ? '' : 's'}`, daysRemaining: Math.ceil((expiration.getTime() - now.getTime()) / DAY) }
  }
  if (now.getTime() > expiration.getTime()) {
    const days = Math.max(1, Math.floor((now.getTime() - expiration.getTime()) / DAY))
    return { classification: 'Expired', label: `Expired ${days} day${days === 1 ? '' : 's'} ago`, daysRemaining: 0 }
  }
  const daysRemaining = Math.max(0, Math.ceil((expiration.getTime() - now.getTime()) / DAY))
  if (daysRemaining <= 30) return { classification: 'Expiring Soon', label: daysRemaining === 0 ? 'Expires today' : `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`, daysRemaining }
  return { classification: 'Active', label: `${daysRemaining} days remaining`, daysRemaining }
}

export const classifyContractValidity = getContractValidity
