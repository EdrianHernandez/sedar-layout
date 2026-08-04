import { FileSearch, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import type { CustomerTransaction, CustomerTransactionStatus, CustomerTransactionType } from '../../types/customer'
import { PrototypeActionMenu, type PrototypeMenuAction } from './PrototypeActionMenu'

interface CustomerTransactionHistoryTabProps { transactions: CustomerTransaction[]; onNotify: (message: string) => void }

const transactionTypes: CustomerTransactionType[] = ['Service Request', 'Quotation', 'Contract', 'Completed Service', 'Invoice', 'Payment']
const transactionStatuses: CustomerTransactionStatus[] = ['Draft', 'Under Review', 'Sent', 'Approved', 'Active', 'Completed', 'Issued', 'Pending', 'Partially Paid', 'Paid', 'Cancelled', 'Expired']
const actions: PrototypeMenuAction[] = [
  { label: 'View Details', message: 'Transaction details will be implemented next.' },
  { label: 'Open Related Record', message: 'The related module will be implemented next.' },
  { label: 'Download Document', message: 'Document downloads will be implemented later.' },
]
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const displayDate = (date: string) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`))

export function CustomerTransactionHistoryTab({ transactions, onNotify }: CustomerTransactionHistoryTabProps) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [type, setType] = useState<CustomerTransactionType | ''>('')
  const [status, setStatus] = useState<CustomerTransactionStatus | ''>('')
  const [period, setPeriod] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const filtersActive = Boolean(search || type || status || period)
  const normalized = deferredSearch.trim().toLowerCase()
  const now = new Date()
  const filtered = transactions.filter((transaction) => {
    let withinPeriod = true
    if (period === 'year') withinPeriod = new Date(`${transaction.date}T00:00:00`).getFullYear() === now.getFullYear()
    if (period === '30' || period === '90') {
      const cutoff = new Date(now)
      cutoff.setDate(cutoff.getDate() - Number(period))
      withinPeriod = new Date(`${transaction.date}T00:00:00`) >= cutoff
    }
    const matchesSearch = !normalized || transaction.reference.toLowerCase().includes(normalized) || transaction.description.toLowerCase().includes(normalized)
    return matchesSearch && (!type || transaction.type === type) && (!status || transaction.status === status) && withinPeriod
  }).sort((a, b) => b.date.localeCompare(a.date))
  const clear = () => { setSearch(''); setType(''); setStatus(''); setPeriod('') }
  const completed = transactions.filter((transaction) => transaction.type === 'Completed Service' || transaction.status === 'Completed').length
  const quoted = transactions.filter((transaction) => transaction.type === 'Quotation').reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0)
  const outstanding = transactions.filter((transaction) => ['Draft', 'Under Review', 'Sent', 'Issued', 'Pending', 'Partially Paid'].includes(transaction.status)).length

  return <section className="transaction-history">
    <div className="transaction-summary" aria-label="Transaction summary"><div><span>Total Transactions</span><strong>{transactions.length}</strong></div><div><span>Completed Services</span><strong>{completed}</strong></div><div><span>Total Quoted Value</span><strong>{currency.format(quoted)}</strong></div><div><span>Outstanding Items</span><strong>{outstanding}</strong></div></div>
    <div className="transaction-panel panel">
      <header><h2>Transaction History</h2></header>
      <div className="customer-filters transaction-filters">
        <label className="customer-search"><span className="sr-only">Search transactions</span><Search size={15} /><input value={search} placeholder="Search by reference or description" onChange={(event) => setSearch(event.target.value)} /></label>
        <label><span className="sr-only">Transaction type</span><select value={type} onChange={(event) => setType(event.target.value as CustomerTransactionType | '')}><option value="">All Transaction Types</option>{transactionTypes.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span className="sr-only">Transaction status</span><select value={status} onChange={(event) => setStatus(event.target.value as CustomerTransactionStatus | '')}><option value="">All Statuses</option>{transactionStatuses.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span className="sr-only">Date period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="">All Dates</option><option value="30">Last 30 Days</option><option value="90">Last 90 Days</option><option value="year">This Year</option></select></label>
        <button className="clear-filters" type="button" disabled={!filtersActive} onClick={clear}>Clear Filters</button>
      </div>
      {!transactions.length ? <div className="customer-empty"><FileSearch size={32} /><strong>No transactions are recorded for this customer.</strong></div> : !filtered.length ? <div className="customer-empty"><FileSearch size={32} /><strong>No transactions match the selected filters.</strong><button className="button button-secondary" type="button" onClick={clear}>Clear Filters</button></div> : <div className="transaction-table-scroll"><table className="transaction-table"><thead><tr><th scope="col">Date</th><th scope="col">Transaction Type</th><th scope="col">Reference Number</th><th scope="col">Description</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>{filtered.map((transaction) => <tr key={transaction.id}><td>{displayDate(transaction.date)}</td><td>{transaction.type}</td><td className="transaction-reference">{transaction.reference}</td><td>{transaction.description}</td><td>{transaction.amount === undefined ? '—' : currency.format(transaction.amount)}</td><td><span className={`transaction-status transaction-status-${transaction.status.toLowerCase().replaceAll(' ', '-')}`}>{transaction.status}</span></td><td className="actions-column"><PrototypeActionMenu label={`Actions for ${transaction.reference}`} actions={actions} open={openMenu === transaction.id} onOpenChange={(open) => setOpenMenu(open ? transaction.id : null)} onNotify={onNotify} /></td></tr>)}</tbody></table></div>}
    </div>
  </section>
}
