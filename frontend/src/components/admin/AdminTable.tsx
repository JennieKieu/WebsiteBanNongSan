import type { ReactNode } from 'react'

type Column<T> = {
  key: string
  title: string
  render: (item: T) => ReactNode
}

type Props<T> = {
  columns: Array<Column<T>>
  items: T[]
  emptyText?: string
}

export function AdminTable<T>({ columns, items, emptyText = 'Không có dữ liệu' }: Props<T>) {
  return (
    <div className="ns-card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td style={{ padding: '12px', color: 'var(--color-text-muted)' }} colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={idx}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    {c.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
