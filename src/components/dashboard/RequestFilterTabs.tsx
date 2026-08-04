import type { RequestFilter } from '../../types'

const filters: RequestFilter[] = ['ALL', 'ACTIVE', 'DRAFTS']

interface RequestFilterTabsProps { selected: RequestFilter; onSelect: (filter: RequestFilter) => void }

export function RequestFilterTabs({ selected, onSelect }: RequestFilterTabsProps) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Service request filters">
      {filters.map((filter) => <button key={filter} type="button" role="tab" aria-selected={selected === filter} className={selected === filter ? 'selected' : ''} onClick={() => onSelect(filter)}>{filter}</button>)}
    </div>
  )
}
