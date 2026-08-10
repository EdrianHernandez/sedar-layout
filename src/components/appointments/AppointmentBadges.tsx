import type { AppointmentStatus, ConfirmationStatus } from '../../types/appointment'
const slug=(value:string)=>value.toLowerCase().replaceAll(' ','-')
export function AppointmentStatusBadge({status}:{status:AppointmentStatus}){return <span className={`global-appointment-badge global-appointment-status-${slug(status)}`}>{status}</span>}
export function ConfirmationStatusBadge({status}:{status:ConfirmationStatus}){return <span className={`global-confirmation-badge global-confirmation-${slug(status)}`}>{status}</span>}
