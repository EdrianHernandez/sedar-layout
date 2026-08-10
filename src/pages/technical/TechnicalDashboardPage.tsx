import { Plus, AlertTriangle, AlertCircle, Anchor, Ship, Wrench, ArrowRight, Clock } from 'lucide-react'

const summaryCards = [
  { label: 'Overdue Maintenance', value: 8, detail: '3 Critical', icon: AlertTriangle, color: '#c0392b', bg: '#fdf0ef' },
  { label: 'Due This Week', value: 12, detail: '4 High Priority', icon: Clock, color: '#d68910', bg: '#fef9e7' },
  { label: 'Open Work Orders', value: 6, detail: '2 In Progress', icon: Wrench, color: '#2e86c1', bg: '#ebf5fb' },
  { label: 'Open Defects', value: 4, detail: '1 Critical', icon: AlertCircle, color: '#884ea0', bg: '#f5eef8' },
  { label: 'Vessels Available', value: '5 / 7', detail: '2 In Dry Dock', icon: Ship, color: '#1e8449', bg: '#eafaf1' },
]

const maintenanceSchedule = [
  { vessel: 'MV SEDAR 01', equipment: 'Main Engine', task: 'Oil & Filter Replacement', dueDate: 'Aug 12, 2026', priority: 'High', status: 'Due Soon' },
  { vessel: 'MV SEDAR 02', equipment: 'Generator', task: 'Inspection', dueDate: 'Aug 14, 2026', priority: 'Medium', status: 'Scheduled' },
  { vessel: 'MV SEDAR 03', equipment: 'Bilge Pump', task: 'Preventive Maintenance', dueDate: 'Aug 15, 2026', priority: 'Low', status: 'Scheduled' },
  { vessel: 'MV SEDAR 01', equipment: 'Cooling System', task: 'Coolant Flush', dueDate: 'Aug 18, 2026', priority: 'Medium', status: 'Scheduled' },
  { vessel: 'MV SEDAR 04', equipment: 'Steering Gear', task: 'Calibration', dueDate: 'Aug 20, 2026', priority: 'High', status: 'Scheduled' },
  { vessel: 'MV SEDAR 02', equipment: 'Deck Crane', task: 'Load Test', dueDate: 'Aug 22, 2026', priority: 'Medium', status: 'Scheduled' },
]

const technicalAlerts = [
  { type: 'critical', title: 'Critical defect reported', desc: 'MV SEDAR 01 – Main engine coolant leak detected during morning inspection. Immediate repair required.', time: '2 hours ago' },
  { type: 'warning', title: 'Maintenance overdue', desc: '3 scheduled maintenance tasks are overdue. Vessel compliance may be affected if not addressed within 7 days.', time: '5 hours ago' },
  { type: 'info', title: 'Spare part below minimum stock', desc: 'Engine oil filters for MV SEDAR 02 are below reorder threshold. Current stock: 4 units. Minimum: 10.', time: '1 day ago' },
  { type: 'info', title: 'Dry dock planning required', desc: 'MV SEDAR 05 dry dock window opens in 45 days. Planning documents need to be submitted to the flag state.', time: '2 days ago' },
]

function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'High': return 'tech-priority-high'
    case 'Medium': return 'tech-priority-medium'
    case 'Low': return 'tech-priority-low'
    default: return ''
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'Due Soon': return 'tech-status-due-soon'
    case 'Scheduled': return 'tech-status-scheduled'
    case 'Completed': return 'tech-status-completed'
    case 'Overdue': return 'tech-status-overdue'
    default: return ''
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'critical': return <AlertTriangle size={15} />
    case 'warning': return <AlertCircle size={15} />
    case 'info': return <Anchor size={15} />
    default: return <Anchor size={15} />
  }
}

export function TechnicalDashboardPage() {
  return (
    <main className="technical-dashboard">
      <header className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">Technical Department</span>
          <h1>Technical Dashboard</h1>
          <p>Overview of vessel maintenance and technical operations.</p>
        </div>
        <div className="tech-header-actions">
          <button className="button button-primary"><Plus size={14} /> New Work Order</button>
          <button className="button button-secondary"><AlertCircle size={14} /> Report Defect</button>
        </div>
      </header>

      <section className="tech-summary-cards" aria-label="Technical dashboard metrics">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="tech-summary-card" style={{ '--card-accent': card.color, '--card-bg': card.bg } as React.CSSProperties}>
              <div className="tech-card-header">
                <span className="tech-card-label">{card.label}</span>
                <span className="tech-card-icon" style={{ color: card.color, background: card.bg }}><Icon size={18} /></span>
              </div>
              <strong className="tech-card-value" style={{ color: card.color }}>{card.value}</strong>
              <span className="tech-card-detail">{card.detail}</span>
            </article>
          )
        })}
      </section>

      <div className="tech-dashboard-panels">
        <section className="tech-panel tech-maintenance-panel" aria-labelledby="maintenance-title">
          <header className="tech-panel-header">
            <div>
              <h2 id="maintenance-title">Maintenance Schedule</h2>
              <p>Upcoming planned maintenance across the fleet.</p>
            </div>
            <a href="/technical/maintenance" className="tech-panel-link">View All <ArrowRight size={13} /></a>
          </header>
          <div className="tech-table-scroll">
            <table className="tech-table">
              <thead>
                <tr>
                  <th>Vessel</th>
                  <th>Equipment</th>
                  <th>Maintenance Task</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {maintenanceSchedule.map((row, i) => (
                  <tr key={i}>
                    <td><span className="tech-vessel-cell"><Ship size={13} /> {row.vessel}</span></td>
                    <td>{row.equipment}</td>
                    <td><strong>{row.task}</strong></td>
                    <td>{row.dueDate}</td>
                    <td><span className={`tech-priority-badge ${getPriorityClass(row.priority)}`}>{row.priority}</span></td>
                    <td><span className={`tech-status-badge ${getStatusClass(row.status)}`}>{row.status}</span></td>
                    <td className="tech-actions-cell"><ArrowRight size={14} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="tech-panel-footer">
            <button className="tech-panel-footer-btn">View All Maintenance Records <ArrowRight size={12} /></button>
          </footer>
        </section>

        <section className="tech-panel tech-alerts-panel" aria-labelledby="alerts-title">
          <header className="tech-panel-header">
            <div>
              <h2 id="alerts-title">Technical Alerts</h2>
              <p>Issues requiring attention across the fleet.</p>
            </div>
          </header>
          <div className="tech-alerts-list">
            {technicalAlerts.map((alert, i) => (
              <article key={i} className={`tech-alert-item tech-alert-${alert.type}`}>
                <span className="tech-alert-icon">{getAlertIcon(alert.type)}</span>
                <div className="tech-alert-content">
                  <strong>{alert.title}</strong>
                  <p>{alert.desc}</p>
                  <time>{alert.time}</time>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
