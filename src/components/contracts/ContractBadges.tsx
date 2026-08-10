import type { ContractReviewStatus } from '../../types/contract'
import type { ContractDisplayStatus } from '../../utils/contractWorkflow'

const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-')
export function ContractStatusBadge({ status }: { status: ContractDisplayStatus }) { return <span className={`global-contract-badge global-contract-status-${slug(status)}`}>{status}</span> }
export function SignatureStatusBadge({ status }: { status: string }) { return <span className={`global-signature-badge global-signature-${slug(status)}`}>{status}</span> }
export function ReviewStatusBadge({ label, status }: { label: string; status: ContractReviewStatus }) { return <span className={`global-review-badge global-review-${slug(status)}`} aria-label={`${label}: ${status}`}>{label}: {status}</span> }
