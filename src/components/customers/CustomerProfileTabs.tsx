import type { KeyboardEvent } from 'react'
import { profileTabs, type ProfileTab } from '../../data/customerProfileTabs'

interface CustomerProfileTabsProps { activeTab: ProfileTab; onChange: (tab: ProfileTab) => void }

export function CustomerProfileTabs({ activeTab, onChange }: CustomerProfileTabsProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % profileTabs.length
    if (event.key === 'ArrowLeft') next = (index - 1 + profileTabs.length) % profileTabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = profileTabs.length - 1
    onChange(profileTabs[next])
    document.getElementById(`customer-tab-${next}`)?.focus()
  }

  return <div className="profile-tabs" role="tablist" aria-label="Customer profile sections">
    {profileTabs.map((tab, index) => <button id={`customer-tab-${index}`} key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-controls="customer-tab-panel" tabIndex={activeTab === tab ? 0 : -1} className={activeTab === tab ? 'active' : ''} onClick={() => onChange(tab)} onKeyDown={(event) => handleKeyDown(event, index)}>{tab}</button>)}
  </div>
}
