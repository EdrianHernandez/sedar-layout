import type { ContractStatus, SignatureStatus } from '../../../types/contract'

const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-')
export function ContractStatusBadge({ status }: { status: ContractStatus }) { return <span className={`contract-badge contract-status-${slug(status)}`} aria-label={`Contract status: ${status}`}>{status}</span> }
export function SignatureStatusBadge({ status }: { status: SignatureStatus }) { return <span className={`contract-badge signature-status-${slug(status)}`} aria-label={`Signature status: ${status}`}>{status}</span> }
