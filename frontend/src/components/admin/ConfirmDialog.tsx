import { Button } from '../ui/Button'

type Props = {
  open: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title = 'Xác nhận thao tác', message, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div className="ns-card" style={{ width: 'min(420px, 90vw)', padding: 'var(--space-5)' }}>
        <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{message}</p>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Hủy
          </Button>
          <Button size="sm" onClick={onConfirm}>
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  )
}
