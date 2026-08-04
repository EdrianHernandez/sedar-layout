import type { ActivityChange, ActivityChangeInput, ActivityMetadataValue } from '../types/customerActivity'

const RESTRICTED_FIELD = /(password|passcode|secret|token|authorization|cookie|session|api.?key|private.?key|credit.?card|payment.?credential|card.?number|cvv|bank.?account|tax|tin|sensitive.?identifier|signature.?image|portal.?credential|base64|blob|file.?content|finance.?note)/i
const SENSITIVE_VALUE = /(bearer\s+[a-z0-9._~-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i
export const REDACTED_ACTIVITY_VALUE = 'Restricted field updated'
const safeValue = (value: unknown): ActivityMetadataValue | undefined => {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string') return undefined
  return SENSITIVE_VALUE.test(value) ? REDACTED_ACTIVITY_VALUE : value.slice(0, 500)
}
export const sanitizeActivityMetadata = (metadata: Readonly<Record<string, unknown>> = {}): Record<string, ActivityMetadataValue> => Object.fromEntries(Object.entries(metadata).flatMap(([key, value]) => { if (RESTRICTED_FIELD.test(key)) return []; const safe = safeValue(value); return safe === undefined ? [] : [[key.slice(0, 80), safe]] }))
export const sanitizeActivityChanges = (changes: readonly ActivityChangeInput[] = []): ActivityChange[] => changes.filter((change) => change.field.trim()).map((change) => { const restricted = change.restricted === true || RESTRICTED_FIELD.test(change.field); return { field: restricted ? 'Restricted field' : change.field.slice(0, 80), previousValue: restricted ? REDACTED_ACTIVITY_VALUE : safeValue(change.previousValue), newValue: restricted ? REDACTED_ACTIVITY_VALUE : safeValue(change.newValue), restricted } })
export const isRestrictedActivityField = (field: string): boolean => RESTRICTED_FIELD.test(field)
