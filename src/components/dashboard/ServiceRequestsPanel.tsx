import type { RequestFilter } from '../../types'
import { RequestFilterTabs } from './RequestFilterTabs'

interface ServiceRequestsPanelProps { filter: RequestFilter; onFilterChange: (filter: RequestFilter) => void }

export function ServiceRequestsPanel({ filter, onFilterChange }: ServiceRequestsPanelProps) {
  return (
    <section className="panel requests-panel" aria-labelledby="requests-heading">
      <header className="panel-header"><h2 id="requests-heading">Service Requests</h2><RequestFilterTabs selected={filter} onSelect={onFilterChange} /></header>
      <div className="table-scroll">
        <table><thead><tr><th>Ref No.</th><th>Customer</th><th>Service Type</th><th>Status</th></tr></thead><tbody><tr><td colSpan={4} className="empty-table">No service requests found.</td></tr></tbody></table>
      </div>
    </section>
  )
}
