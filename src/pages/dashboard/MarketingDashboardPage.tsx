import { useDeferredValue, useEffect, useState, type ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarDays, Check, ChevronDown, CircleDot, ClipboardCheck, Clock3, FileCheck2, FileText, ListTodo, MessageSquareText, MoreHorizontal, Plus, RefreshCw, Search, UserPlus, Video } from 'lucide-react'
import { initialCustomers } from '../../data/customerMockData'
import { formatDashboardTime, formatRelativeDate, formatShortDate, getDashboardGreeting, getManilaDateKey } from '../../dashboard/marketingDashboardFormatters'
import { getMarketingDashboardData } from '../../dashboard/marketingDashboardSelectors'
import type { DashboardData, DashboardFollowUp, DashboardMetric, DashboardPriority, DashboardTask, MarketingDashboardSource, WorkQueueTab } from '../../dashboard/marketingDashboardTypes'
import { appointmentRepository } from '../../repositories/appointmentRepository'
import { contractRepository } from '../../repositories/contractRepository'
import { customerActivityReader, customerActivityRepository } from '../../repositories/customerActivityRepository'
import { quotationRepository } from '../../repositories/quotationRepository'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../../types/customerActivity'
import { getAppointmentConfirmationStatus } from '../../utils/appointmentWorkflow'

interface MarketingDashboardPageProps { onNotify: (message: string) => void }

const iconByMetric: Record<DashboardMetric['icon'], ComponentType<{ size?: number }>> = { requests: FileText, review: ClipboardCheck, quotation: MessageSquareText, contract: FileCheck2, appointment: CalendarDays }
const priorityOrder: DashboardPriority[] = ['Critical', 'High', 'Medium', 'Normal']

function loadSource(): MarketingDashboardSource {
  return { customers: initialCustomers, serviceRequests: serviceRequestRepository.getAll(), quotations: quotationRepository.getAll(), contracts: contractRepository.getAll(), appointments: appointmentRepository.getAll(), activities: customerActivityReader.getAll() }
}

export function MarketingDashboardPage({ onNotify }: MarketingDashboardPageProps) {
  const navigate = useNavigate()
  const [source, setSource] = useState<MarketingDashboardSource>(loadSource)
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState('')
  const currentUser: string | undefined = undefined

  const refresh = () => {
    try { setSource(loadSource()); setNow(new Date()); setError('') } catch { setError('The dashboard could not load the latest Marketing records.') }
  }

  useEffect(() => {
    const timer = window.setInterval(refresh, 60_000)
    const onStorage = () => refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.clearInterval(timer); window.removeEventListener('storage', onStorage); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  if (error) return <DashboardError message={error} onRetry={refresh} />

  const data = getMarketingDashboardData(source, currentUser, now)
  const feasibleRequest = source.serviceRequests.find((record) => ['Feasible', 'Feasible with Conditions'].includes(record.operationsReview?.status ?? '') && !source.quotations.some((quotation) => quotation.serviceRequestId === record.id))
  const acceptedQuotation = source.quotations.find((record) => ['Accepted', 'Customer Approved'].includes(record.status) && !source.contracts.some((contract) => contract.quotationId === record.id))

  const completeFollowUp = (item: DashboardFollowUp) => {
    if (item.sourceType === 'Appointment') {
      const appointment = appointmentRepository.getById(item.id)
      if (appointment) appointmentRepository.update(item.id, { followUp: { ...appointment.followUp, completed: true } })
    }
    customerActivityRepository.append({ customerId: item.customerId, module: item.sourceType === 'Customer' ? 'Customer Account' : item.sourceType === 'Service Request' ? 'Service Requests' : item.sourceType === 'Quotation' ? 'Quotations' : 'Appointments', action: 'Follow-up Completed', description: `Marketing follow-up completed for ${item.reference}.`, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: item.type, id: item.id, referenceNumber: item.reference }, visibility: 'Internal', systemGenerated: false, eventSource: 'marketingDashboard' })
    refresh()
    onNotify('Follow-up marked complete. The related business record was not completed.')
  }

  return <main className="marketing-dashboard-page">
    <DashboardHeader now={now} currentUser={currentUser} onNewRequest={() => navigate('/marketing/service-requests/new')} onSchedule={() => navigate('/marketing/appointments?action=schedule')} feasibleRequestId={feasibleRequest?.id} acceptedQuotationId={acceptedQuotation?.id} />
    <DashboardKpis metrics={data.metrics} />
    <AttentionPanel items={data.attention} now={now} />
    <div className="dashboard-action-layout">
      <div className="dashboard-primary-column">
        <WorkQueue data={data} now={now} />
        <FollowUpsPanel items={data.followUps} now={now} onComplete={completeFollowUp} />
      </div>
      <aside className="dashboard-secondary-column">
        <SchedulePanel data={data} source={source} onSchedule={() => navigate('/marketing/appointments?action=schedule')} />
        <RecentActivityPanel data={data} now={now} />
      </aside>
    </div>
    <PipelinePanel data={data} />
  </main>
}

function DashboardHeader({ now, currentUser, onNewRequest, onSchedule, feasibleRequestId, acceptedQuotationId }: { now: Date; currentUser?: string; onNewRequest: () => void; onSchedule: () => void; feasibleRequestId?: string; acceptedQuotationId?: string }) {
  return <header className="action-dashboard-header">
    <div className="dashboard-heading"><h1>Dashboard</h1>{currentUser ? <><strong>{getDashboardGreeting(now)}, {currentUser.split(' ')[0]}</strong><p>Here’s what needs your attention today.</p></> : <><strong>Marketing Dashboard</strong><p>Here’s what needs your attention today.</p></>}</div>
    <div className="dashboard-header-tools">
      <label className="dashboard-global-search"><Search size={15}/><span className="sr-only">Search Marketing modules</span><input placeholder="Search records" onKeyDown={(event) => { if (event.key === 'Enter' && event.currentTarget.value.trim()) window.location.assign(`/marketing/service-requests?search=${encodeURIComponent(event.currentTarget.value.trim())}`) }} /></label>
      <button className="button button-primary" onClick={onNewRequest}><Plus size={15}/> New Service Request</button>
      <button className="button button-secondary" onClick={onSchedule}><CalendarDays size={15}/> Schedule Appointment</button>
      <details className="dashboard-quick-menu"><summary className="button button-secondary" aria-label="Open quick actions"><MoreHorizontal size={16}/><span>Quick Actions</span><ChevronDown size={13}/></summary><div>
        <Link to="/marketing/customers"><UserPlus size={14}/> Add Customer</Link>
        {feasibleRequestId ? <Link to={`/marketing/quotations/new?serviceRequestId=${feasibleRequestId}`}><FileText size={14}/> Create Quotation</Link> : <span title="Requires an operationally feasible service request"><FileText size={14}/> Create Quotation <small>Unavailable</small></span>}
        {acceptedQuotationId ? <Link to={`/marketing/contracts/new?quotationId=${acceptedQuotationId}`}><FileCheck2 size={14}/> Request Contract</Link> : <span title="Requires an accepted quotation"><FileCheck2 size={14}/> Request Contract <small>Unavailable</small></span>}
        <Link to="/marketing/appointments?action=schedule&type=follow-up"><Clock3 size={14}/> Add Follow-up</Link>
      </div></details>
    </div>
  </header>
}

function DashboardKpis({ metrics }: { metrics: DashboardMetric[] }) {
  return <section className="action-kpi-grid" aria-label="Marketing dashboard metrics">{metrics.map((metric) => { const Icon = iconByMetric[metric.icon]; return <Link key={metric.id} to={metric.href} className="action-kpi-card" aria-label={`${metric.label}: ${metric.count}. ${metric.detail}`}><div><span>{metric.label}</span><i><Icon size={22}/></i></div><strong>{metric.count}</strong><p>{metric.detail}</p><small>Open filtered records <ArrowRight size={11}/></small></Link> })}</section>
}

function AttentionPanel({ items, now }: { items: DashboardTask[]; now: Date }) {
  return <section className="dashboard-panel attention-panel" aria-labelledby="attention-title"><header><div><span className="panel-kicker">Priority desk</span><h2 id="attention-title">Attention Required</h2><p>The highest-priority Marketing actions across active customer work.</p></div><Link to="/marketing/service-requests?filter=attention">View All Tasks <ArrowRight size={13}/></Link></header>
    {items.length ? <div className="attention-list">{items.map((item) => <article key={`${item.type}-${item.id}`}><span className={`priority-rail ${item.priority.toLowerCase()}`}/><div className="attention-identity"><span className={`dashboard-priority ${item.priority.toLowerCase()}`}>{item.priority}</span><small>{item.type}</small><Link to={item.href}>{item.reference}</Link></div><div className="attention-main"><strong>{item.customer}</strong><p>{item.reason}</p><small title={item.dueAt ? formatShortDate(item.dueAt) : undefined}>{item.dueAt ? formatRelativeDate(item.dueAt, now) : `Updated ${formatRelativeDate(item.updatedAt, now)}`} · {item.assignedRepresentative}</small></div><div className="attention-actions"><Link className="button button-primary" to={item.href}>{item.nextAction}</Link><Link className="button button-secondary" to={item.href}>View</Link></div></article>)}</div> : <DashboardEmpty icon={Check} title="You’re all caught up" text="No urgent Marketing actions require attention." />}
  </section>
}

function WorkQueue({ data, now }: { data: DashboardData; now: Date }) {
  const [tab, setTab] = useState<WorkQueueTab>('My Tasks')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.toLowerCase())
  const [status, setStatus] = useState('All')
  const [priority, setPriority] = useState('All')
  const tabs: WorkQueueTab[] = ['My Tasks', 'Service Requests', 'Quotations', 'Contracts', 'Follow-ups']
  const rows = data.workQueue.filter((item) => tab === 'My Tasks' || tab === 'Follow-ups' ? tab !== 'Follow-ups' || item.status === 'Follow-up Due' : item.type === tab.slice(0, -1)).filter((item) => status === 'All' || item.status === status).filter((item) => priority === 'All' || item.priority === priority).filter((item) => !deferredSearch || `${item.reference} ${item.customer} ${item.nextAction}`.toLowerCase().includes(deferredSearch)).slice(0, 8)
  const statuses = [...new Set(data.workQueue.map((item) => item.status))].sort()
  return <section className="dashboard-panel work-queue-panel" aria-labelledby="queue-title"><header><div><span className="panel-kicker">Assigned work</span><h2 id="queue-title">{data.isPersonalized ? 'My Work Queue' : 'Marketing Work Queue'}</h2><p>{data.isPersonalized ? 'Tasks prioritized for your assigned customer records.' : 'All active Marketing records, prioritized by urgency and due date.'}</p></div><Link to="/marketing/service-requests">View All <ArrowRight size={13}/></Link></header>
    <div className="work-queue-tabs" role="tablist" aria-label="Work queue type">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    <div className="work-queue-tools"><label><Search size={14}/><span className="sr-only">Search work queue</span><input value={search} placeholder="Search reference or customer" onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option>All</option>{priorityOrder.map((item) => <option key={item}>{item}</option>)}</select></div>
    {rows.length ? <div className="work-queue-table"><table><thead><tr><th>Reference</th><th>Customer / Type</th><th>Status</th><th>Next Action</th><th>Due</th><th>Priority</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map((item) => <tr key={`${item.type}-${item.id}`} onClick={() => window.location.assign(item.href)}><td><Link to={item.href} onClick={(event) => event.stopPropagation()}>{item.reference}</Link></td><td><strong>{item.customer}</strong><small>{item.type}</small></td><td><span className="queue-status">{item.status}</span></td><td>{item.nextAction}</td><td title={item.dueAt ? formatShortDate(item.dueAt) : undefined} className={item.overdue ? 'overdue' : ''}>{item.dueAt ? formatRelativeDate(item.dueAt, now) : 'Not set'}</td><td><span className={`dashboard-priority ${item.priority.toLowerCase()}`}>{item.priority}</span></td><td><Link to={item.href} aria-label={`View ${item.reference}`} onClick={(event) => event.stopPropagation()}><ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div> : <DashboardEmpty icon={ListTodo} title="No active work items" text="New requests, quotations, and contract tasks will appear here." />}
  </section>
}

function SchedulePanel({ data, source, onSchedule }: { data: DashboardData; source: MarketingDashboardSource; onSchedule: () => void }) {
  const customer = (id: string) => source.customers.find((item) => item.id === id)?.companyName ?? 'Unknown customer'
  return <section className="dashboard-panel schedule-action-panel" aria-labelledby="schedule-title"><header><div><span className="panel-kicker">Asia/Manila</span><h2 id="schedule-title">Today’s Schedule</h2></div><Link to="/marketing/appointments?view=calendar">Full Calendar <ArrowRight size={13}/></Link></header>
    {data.appointments.length ? <div className="today-appointments">{data.appointments.map((item) => <article key={item.id}><time>{formatDashboardTime(item.startAt)}<span>–{formatDashboardTime(item.endAt)}</span></time><div><strong>{item.title}</strong><p>{customer(item.customerId)}</p><small>{item.type} · {item.meetingMethod}</small><small>{getAppointmentConfirmationStatus(item)} · {item.assignedRepresentativeName ?? item.assignedRepresentativeId}</small>{item.meetingMethod === 'Video Meeting' && item.meetingLink ? <a href={item.meetingLink} target="_blank" rel="noreferrer"><Video size={12}/> Join Meeting</a> : item.location ? <span className="appointment-location">{item.location}</span> : <Link to={`/marketing/appointments?appointmentId=${item.id}`}>View Appointment</Link>}</div></article>)}</div> : <DashboardEmpty icon={CalendarDays} title="No appointments scheduled today." text="Schedule a customer meeting or review the full calendar." />}
    <button className="button button-secondary panel-wide-action" onClick={onSchedule}><Plus size={14}/> Schedule Appointment</button>
  </section>
}

function FollowUpsPanel({ items, now, onComplete }: { items: DashboardFollowUp[]; now: Date; onComplete: (item: DashboardFollowUp) => void }) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const shown = items.filter((item) => !dismissed.includes(`${item.sourceType}-${item.id}`)).slice(0, 6)
  const group = (item: DashboardFollowUp) => item.overdue ? 'Overdue' : item.dueAt && getManilaDateKey(item.dueAt) === getManilaDateKey(now) ? 'Due Today' : 'Upcoming'
  return <section className="dashboard-panel followups-panel" aria-labelledby="followups-title"><header><div><span className="panel-kicker">Customer commitments</span><h2 id="followups-title">Follow-ups Due</h2><p>Completing a follow-up records activity only; it does not complete the related record.</p></div><Link to="/marketing/appointments?view=list">View All <ArrowRight size={13}/></Link></header>
    {shown.length ? <div className="followup-groups">{(['Overdue', 'Due Today', 'Upcoming'] as const).map((name) => { const rows = shown.filter((item) => group(item) === name); return rows.length ? <div key={name}><h3>{name}<span>{rows.length}</span></h3>{rows.map((item) => <article key={`${item.sourceType}-${item.id}`}><div><strong>{item.customer}</strong><Link to={item.href}>{item.reference} · {item.reason}</Link><small>{item.dueAt ? formatShortDate(item.dueAt) : 'Date not set'} · {item.assignedRepresentative}</small></div><div><button aria-label={`Mark ${item.reference} follow-up complete`} onClick={() => { onComplete(item); setDismissed((value) => [...value, `${item.sourceType}-${item.id}`]) }}><Check size={13}/> Complete</button><Link to={`/marketing/appointments?action=schedule&type=follow-up&relatedId=${item.id}`}>Reschedule</Link><Link to={item.href}>View</Link></div></article>)}</div> : null })}</div> : <DashboardEmpty icon={Check} title="No follow-ups due" text="Customer follow-ups will appear here when scheduled." />}
  </section>
}

function RecentActivityPanel({ data, now }: { data: DashboardData; now: Date }) {
  return <section className="dashboard-panel activity-action-panel" aria-labelledby="activity-title"><header><div><span className="panel-kicker">Shared Marketing events</span><h2 id="activity-title">Recent Activity</h2></div><Link to="/marketing/customers">View All Activity <ArrowRight size={13}/></Link></header>
    {data.activities.length ? <ol>{data.activities.slice(0, 7).map((item) => <li key={item.id}><i>{item.module === 'Appointments' ? <CalendarDays size={13}/> : item.module === 'Contracts' ? <FileCheck2 size={13}/> : item.module === 'Quotations' ? <MessageSquareText size={13}/> : <CircleDot size={13}/>}</i><div><strong>{item.description}</strong><p>{item.customer}</p><small title={formatShortDate(item.occurredAt)}>{item.actor} · {formatRelativeDate(item.occurredAt, now)}</small>{item.reference && (item.href ? <Link to={item.href}>{item.reference}</Link> : <span>{item.reference}</span>)}</div></li>)}</ol> : <DashboardEmpty icon={Clock3} title="No recent Marketing activity." text="Shared customer and record events will appear here." />}
  </section>
}

function PipelinePanel({ data }: { data: DashboardData }) {
  return <section className="dashboard-panel pipeline-snapshot" aria-labelledby="pipeline-title"><header><div><span className="panel-kicker">Linked customer journey</span><h2 id="pipeline-title">Marketing Pipeline Snapshot</h2><p>Only records connected through service request, quotation, and contract IDs are counted.</p></div><Link to="/marketing/reports">View Full Reports <ArrowRight size={13}/></Link></header><div>{data.pipeline.map((stage, index) => <Link key={stage.id} to={stage.href}><span>{index + 1}</span><small>{stage.label}</small><strong>{stage.count}</strong><p>{stage.conversion === undefined ? 'Starting stage' : `${Math.round(stage.conversion)}% from previous`}</p></Link>)}</div></section>
}

function DashboardEmpty({ icon: Icon, title, text }: { icon: ComponentType<{ size?: number }>; title: string; text: string }) { return <div className="dashboard-empty"><Icon size={21}/><strong>{title}</strong><p>{text}</p></div> }
function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) { return <main className="marketing-dashboard-page"><div className="dashboard-error"><AlertCircle size={28}/><h1>Dashboard unavailable</h1><p>{message}</p><button className="button button-primary" onClick={onRetry}><RefreshCw size={14}/> Retry</button></div></main> }
