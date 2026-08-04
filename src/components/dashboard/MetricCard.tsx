import type { Metric } from '../../types'

export function MetricCard({ label, value, detail, icon: Icon }: Metric) {
  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {detail && <span className="metric-detail">{detail}</span>}
      <Icon className="metric-icon" aria-hidden="true" strokeWidth={1.25} />
    </article>
  )
}
