type Props = {
  status: string
}

const COLORS: Record<string, string> = {
  Pending: '#d97706',
  Confirmed: '#2563eb',
  Shipping: '#0891b2',
  Completed: '#16a34a',
  Cancelled: '#dc2626',
  New: '#2563eb',
  Read: '#d97706',
  Replied: '#16a34a',
}

export function StatusBadge({ status }: Props) {
  const color = COLORS[status] ?? '#6b7280'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: `${color}1a`,
        color,
      }}
    >
      {status}
    </span>
  )
}
