import type { Contract, ContractStatus } from '../types/contract'

export function getEffectiveContractStatus(contract: Contract, now: Date = new Date()): ContractStatus {
  if (contract.status !== 'Active') return contract.status
  const expiration = new Date(contract.expirationDate)
  return !Number.isNaN(expiration.getTime()) && expiration.getTime() < now.getTime() ? 'Expired' : contract.status
}

export const getEffectiveStatus = getEffectiveContractStatus
