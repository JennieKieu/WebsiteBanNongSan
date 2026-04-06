import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  align?: 'center' | 'left'
  action?: ReactNode
}

export function SectionHeading({ title, description, align = 'center', action }: Props) {
  const mod = align === 'left' ? 'ns-section-head--left' : ''
  return (
    <div className={`ns-section-head ${mod}`.trim()}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: align === 'left' ? 'flex-start' : 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h2 className="ns-section-head__title">{title}</h2>
          <div className="ns-section-head__line" aria-hidden />
          {description ? <p className="ns-section-head__desc">{description}</p> : null}
        </div>
        {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
      </div>
    </div>
  )
}
