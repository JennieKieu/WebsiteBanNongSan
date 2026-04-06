import { useEffect, useState } from 'react'
import { deleteAdminCustomer, getAdminCustomers, updateAdminCustomer } from '../../api/admin/customers'
import type { Customer } from '../../api/admin/types'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { AdminTable } from '../../components/admin/AdminTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { Button } from '../../components/ui/Button'

export default function AdminCustomersPage() {
  const [items, setItems] = useState<Customer[]>([])
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const pageSize = 10

  const load = async () => {
    const data = await getAdminCustomers({ page, pageSize })
    setItems(data)
  }

  useEffect(() => {
    void load()
  }, [page])

  const openEdit = (x: Customer) => {
    setEditing(x)
    setFirstName(x.firstName || '')
    setLastName(x.lastName || '')
    setPhone(x.phone || '')
  }

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Quản lý khách hàng
      </h1>

      <AdminTable
        items={items}
        columns={[
          { key: 'name', title: 'Họ tên', render: (x) => `${x.lastName || ''} ${x.firstName || ''}`.trim() || '-' },
          { key: 'email', title: 'Email', render: (x) => x.email },
          { key: 'phone', title: 'SĐT', render: (x) => x.phone || '-' },
          { key: 'role', title: 'Role', render: (x) => x.role },
          { key: 'created', title: 'Ngày tạo', render: (x) => new Date(x.createdAt).toLocaleString('vi-VN') },
          {
            key: 'action',
            title: 'Thao tác',
            render: (x) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="ghost" onClick={() => openEdit(x)}>
                  Sửa
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(x)}>
                  Xóa
                </Button>
              </div>
            ),
          },
        ]}
      />

      <AdminPagination page={page} pageSize={pageSize} hasNext={items.length === pageSize} onPageChange={setPage} />

      {editing ? (
        <div className="ns-card" style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)' }}>
          <h3 style={{ marginTop: 0 }}>Cập nhật khách hàng</h3>
          <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <input className="ns-input" value={lastName} placeholder="Họ" onChange={(e) => setLastName(e.target.value)} />
            <input className="ns-input" value={firstName} placeholder="Tên" onChange={(e) => setFirstName(e.target.value)} />
            <input className="ns-input" value={phone} placeholder="Số điện thoại" onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8 }}>
            <Button
              onClick={async () => {
                await updateAdminCustomer(editing.id, { firstName, lastName, phone })
                setEditing(null)
                await load()
              }}
            >
              Lưu thay đổi
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Hủy
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        message={`Xóa khách hàng "${deleting?.email ?? ''}"?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await deleteAdminCustomer(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
