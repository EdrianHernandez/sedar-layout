import type { ContactStatus, ContactType } from '../../../types/customerContact'

export function ContactTypeBadge({ type }: { type: ContactType }) { return <span className="contact-type-badge">{type}</span> }
export function ContactStatusBadge({ status }: { status: ContactStatus }) { return <span className={`contact-status-badge contact-${status.toLowerCase()}`}>{status}</span> }
