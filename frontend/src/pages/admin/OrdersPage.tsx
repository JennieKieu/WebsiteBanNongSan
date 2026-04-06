import { useEffect, useState } from 'react'
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin/orders'
import type { Order } from '../../api/admin/types'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { AdminTable } from '../../components/admin/AdminTable'
import { StatusBadge } from '../../components/admin/StatusBadge'

const STATUSES = ['Pending', 'Confirmed', 'Shipping', 'Completed', 'Cancelled']

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10

  const load = async () => {
    const data = await getAdminOrders({ page, pageSize })
    setItems(data)
  }

  useEffect(() => {
    void load()
  }, [page])

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Quản lý đơn hàng
      </h1>

      <AdminTable
        items={items}
        columns={[
          { key: 'id', title: 'Mã đơn', render: (x) => x.id.slice(0, 8) },
          { key: 'customer', title: 'Khách hàng', render: (x) => x.userName || x.userEmail || '-' },
          { key: 'amount', title: 'Tổng tiền', render: (x) => `${x.totalAmount.toLocaleString('vi-VN')}đ` },
          { key: 'created', title: 'Ngày tạo', render: (x) => new Date(x.createdAt).toLocaleString('vi-VN') },
          { key: 'status', title: 'Trạng thái', render: (x) => <StatusBadge status={x.status} /> },
          {
            key: 'action',
            title: 'Cập nhật',
            render: (x) => (
              <select
                className="ns-select"
                value={x.status}
                onChange={async (e) => {
                  await updateAdminOrderStatus(x.id, e.target.value)
                  await load()
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />

      <AdminPagination page={page} pageSize={pageSize} hasNext={items.length === pageSize} onPageChange={setPage} />
    </div>
  )
}
