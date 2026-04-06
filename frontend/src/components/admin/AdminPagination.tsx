import { Button } from '../ui/Button'

type Props = {
  page: number
  pageSize: number
  total?: number
  hasNext?: boolean
  onPageChange: (nextPage: number) => void
}

export function AdminPagination({ page, pageSize, total, hasNext, onPageChange }: Props) {
  const knownTotalPages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : undefined
  const canPrev = page > 1
  const canNext = knownTotalPages != null ? page < knownTotalPages : Boolean(hasNext)

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
      <Button variant="ghost" size="sm" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
        Trang trước
      </Button>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Trang {page}
        {knownTotalPages != null ? ` / ${knownTotalPages}` : ''}
      </span>
      <Button variant="ghost" size="sm" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
        Trang sau
      </Button>
    </div>
  )
}
