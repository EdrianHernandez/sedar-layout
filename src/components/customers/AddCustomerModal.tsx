import { X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { customerStatuses, customerTypes } from '../../data/customerMockData'
import type { CustomerStatus, CustomerType, NewCustomerInput } from '../../types/customer'

interface AddCustomerModalProps {
  representatives: string[]
  onClose: () => void
  onSubmit: (customer: NewCustomerInput) => void
}

const initialForm: NewCustomerInput = {
  companyName: '', customerType: '' as CustomerType, businessAddress: '', cityProvince: '', country: 'Philippines', taxId: '', companyEmail: '', companyPhone: '', website: '',
  firstName: '', lastName: '', position: '', contactEmail: '', contactPhone: '', status: 'Prospect', assignedRepresentative: '', leadSource: '', notes: '',
}

type FormErrors = Partial<Record<keyof NewCustomerInput, string>>

export function AddCustomerModal({ representatives, onClose, onSubmit }: AddCustomerModalProps) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea, [href]')].filter((element) => !element.hasAttribute('disabled'))
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const update = <K extends keyof NewCustomerInput>(field: K, value: NewCustomerInput[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!form.companyName.trim()) nextErrors.companyName = 'Company name is required.'
    if (!form.customerType) nextErrors.customerType = 'Customer type is required.'
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.'
    if (!form.contactEmail.trim()) nextErrors.contactEmail = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) nextErrors.contactEmail = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(form)
  }

  const input = (field: keyof NewCustomerInput, label: string, options?: { required?: boolean; type?: string; ref?: typeof firstFieldRef }) => (
    <label className="form-field">
      <span>{label}{options?.required && <em> *</em>}</span>
      <input ref={options?.ref} type={options?.type ?? 'text'} value={String(form[field])} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} onChange={(event) => update(field, event.target.value as never)} />
      {errors[field] && <small id={`${field}-error`}>{errors[field]}</small>}
    </label>
  )

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} className="customer-modal" role="dialog" aria-modal="true" aria-labelledby="add-customer-title" aria-describedby="add-customer-description">
        <header className="modal-header">
          <div><h2 id="add-customer-title">Add Customer</h2><p id="add-customer-description">Create a new customer account for Marketing.</p></div>
          <button type="button" aria-label="Close add customer dialog" onClick={onClose}><X size={18} /></button>
        </header>
        <form onSubmit={submit} noValidate>
          <div className="modal-body">
            <fieldset><legend>Company Information</legend><div className="form-grid">
              {input('companyName', 'Company Name', { required: true, ref: firstFieldRef })}
              <label className="form-field"><span>Customer Type <em>*</em></span><select value={form.customerType} aria-invalid={Boolean(errors.customerType)} onChange={(event) => update('customerType', event.target.value as CustomerType)}><option value="">Select customer type</option>{customerTypes.map((type) => <option key={type}>{type}</option>)}</select>{errors.customerType && <small>{errors.customerType}</small>}</label>
              {input('businessAddress', 'Business Address')}{input('cityProvince', 'City/Province')}{input('country', 'Country')}{input('taxId', 'Tax Identification Number')}{input('companyEmail', 'Company Email', { type: 'email' })}{input('companyPhone', 'Company Phone', { type: 'tel' })}{input('website', 'Website')}
            </div></fieldset>
            <fieldset><legend>Primary Contact</legend><div className="form-grid">
              {input('firstName', 'First Name', { required: true })}{input('lastName', 'Last Name', { required: true })}{input('position', 'Position')}{input('contactEmail', 'Email Address', { required: true, type: 'email' })}{input('contactPhone', 'Phone Number', { type: 'tel' })}
            </div></fieldset>
            <fieldset><legend>Marketing Information</legend><div className="form-grid">
              <label className="form-field"><span>Account Status</span><select value={form.status} onChange={(event) => update('status', event.target.value as CustomerStatus)}>{customerStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="form-field"><span>Assigned Marketing Representative</span><select value={form.assignedRepresentative} onChange={(event) => update('assignedRepresentative', event.target.value)}><option value="">Unassigned</option>{representatives.map((representative) => <option key={representative}>{representative}</option>)}</select></label>
              <label className="form-field"><span>Lead Source</span><select value={form.leadSource} onChange={(event) => update('leadSource', event.target.value)}><option value="">Select lead source</option>{['Direct Inquiry', 'Referral', 'Existing Relationship', 'Website', 'Industry Event', 'Other'].map((source) => <option key={source}>{source}</option>)}</select></label>
              <label className="form-field form-field-wide"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
            </div></fieldset>
          </div>
          <footer className="modal-footer"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Add Customer</button></footer>
        </form>
      </div>
    </div>
  )
}
