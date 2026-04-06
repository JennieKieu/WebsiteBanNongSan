import { useEffect, useState } from 'react'
import api from '../../api/client'

type Stats = {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  lowStockCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get('/admin/Stats').then((r) => setStats(r.data))
  }, [])

  if (!stats) {
    return <div className="ns-loading">Đang tải…</div>
  }

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-6)' }}>
        Dashboard
      </h1>
      <div className="ns-grid-stats">
        <div className="ns-stat-card">
          <p className="ns-stat-card__label">Doanh thu</p>
          <p className="ns-stat-card__value ns-stat-card__value--primary">{stats.totalRevenue?.toLocaleString('vi-VN')}đ</p>
        </div>
        <div className="ns-stat-card">
          <p className="ns-stat-card__label">Đơn hàng</p>
          <p className="ns-stat-card__value">{stats.totalOrders}</p>
        </div>
        <div className="ns-stat-card">
          <p className="ns-stat-card__label">Sản phẩm</p>
          <p className="ns-stat-card__value">{stats.totalProducts}</p>
        </div>
        <div className="ns-stat-card">
          <p className="ns-stat-card__label">Khách hàng</p>
          <p className="ns-stat-card__value">{stats.totalCustomers}</p>
        </div>
        <div className="ns-stat-card">
          <p className="ns-stat-card__label">Sắp hết hàng</p>
          <p className={`ns-stat-card__value ${stats.lowStockCount > 0 ? 'ns-stat-card__value--danger' : ''}`}>{stats.lowStockCount}</p>
        </div>
      </div>
    </div>
  )
}
