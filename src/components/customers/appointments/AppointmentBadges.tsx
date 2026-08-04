import type { AppointmentStatus } from '../../../types/appointment'
const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-')
export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) { return <span className={`appointment-status-badge appointment-status-${slug(status)}`} aria-label={`Status: ${status}`}>{status}</span> }
