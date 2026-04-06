import { useEffect, useState } from 'react'
import { deleteAdminContact, getAdminContacts, updateAdminContactStatus } from '../../api/admin/contacts'
import type { Contact } from '../../api/admin/types'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { AdminTable } from '../../components/admin/AdminTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/ui/Button'

const STATUS = ['New', 'Read', 'Replied']

export default function AdminContactsPage() {
  const [items, setItems] = useState<Contact[]>([])
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const pageSize = 10

  const load = async () => {
    const data = await getAdminContacts({ page, pageSize })
    setItems(data)
  }

  useEffect(() => {
    void load()
  }, [page])

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Quản lý liên hệ
      </h1>

      <AdminTable
        items={items}
        columns={[
          { key: 'name', title: 'Khách hàng', render: (x) => x.name },
          { key: 'contact', title: 'Email / SĐT', render: (x) => `${x.email}${x.phone ? ` / ${x.phone}` : ''}` },
          { key: 'subject', title: 'Chủ đề', render: (x) => x.subject || '-' },
          { key: 'message', title: 'Nội dung', render: (x) => (x.message.length > 80 ? `${x.message.slice(0, 80)}...` : x.message) },
          { key: 'status', title: 'Trạng thái', render: (x) => <StatusBadge status={x.status} /> },
          {
            key: 'actions',
            title: 'Thao tác',
            render: (x) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="ns-select"
                  value={x.status}
                  onChange={async (e) => {
                    await updateAdminContactStatus(x.id, e.target.value)
                    await load()
                  }}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(x)}>
                  Xóa
                </Button>
              </div>
            ),
          },
        ]}
      />

      <AdminPagination page={page} pageSize={pageSize} hasNext={items.length === pageSize} onPageChange={setPage} />

      <ConfirmDialog
        open={Boolean(deleting)}
        message={`Xóa liên hệ của "${deleting?.name ?? ''}"?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await deleteAdminContact(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
