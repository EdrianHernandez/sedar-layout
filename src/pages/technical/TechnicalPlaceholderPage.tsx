import { Construction } from 'lucide-react'

interface TechnicalPlaceholderPageProps {
  title: string
  description: string
}

export function TechnicalPlaceholderPage({ title, description }: TechnicalPlaceholderPageProps) {
  return (
    <main className="technical-placeholder-page">
      <div className="tech-placeholder-content">
        <span className="tech-placeholder-icon"><Construction size={32} /></span>
        <h1>{title}</h1>
        <p>{description}</p>
        <span className="tech-placeholder-badge">Under Development</span>
      </div>
    </main>
  )
}
