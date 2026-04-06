import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  as?: 'div' | 'main' | 'section'
}

export function Container({ children, className = '', as: Tag = 'div' }: Props) {
  return <Tag className={`ns-container ${className}`.trim()}>{children}</Tag>
}
