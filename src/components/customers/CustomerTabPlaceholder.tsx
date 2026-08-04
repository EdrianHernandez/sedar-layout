import type { LucideIcon } from 'lucide-react'

interface CustomerTabPlaceholderProps { icon: LucideIcon; title: string; description: string }

export function CustomerTabPlaceholder({ icon: Icon, title, description }: CustomerTabPlaceholderProps) {
  return <section className="profile-placeholder-panel"><Icon size={30} aria-hidden="true" /><h2>{title}</h2><p>{description}</p><strong>This section will be implemented next.</strong></section>
}
