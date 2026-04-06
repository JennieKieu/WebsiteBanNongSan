import type { CSSProperties } from 'react'
import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'

const navLinkStyle: CSSProperties = {
  display: 'block',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-sm)',
  color: '#e5e7eb',
}

const activeNavLinkStyle: CSSProperties = {
  ...navLinkStyle,
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
}

export default function AdminLayout() {
  const { user, isAdmin, authReady } = useAuth()

  if (!authReady) return <div className="ns-loading">Đang xác thực...</div>

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="ns-admin-shell">
      <aside className="ns-admin-sidebar">
        <div style={{ padding: 'var(--space-4)' }}>
          <h2 style={{ margin: '0 0 var(--space-4)', fontSize: '1.125rem', fontWeight: 700 }}>Natural Store Admin</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <NavLink to="/admin" end style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/products" style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Sản phẩm
            </NavLink>
            <NavLink to="/admin/categories" style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Danh mục
            </NavLink>
            <NavLink to="/admin/orders" style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Đơn hàng
            </NavLink>
            <NavLink to="/admin/customers" style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Khách hàng
            </NavLink>
            <NavLink to="/admin/banners" style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Banner
            </NavLink>
            <NavLink to="/admin/contacts" style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}>
              Liên hệ
            </NavLink>
            <NavLink
              to="/"
              style={{
                ...navLinkStyle,
                marginTop: 'var(--space-4)',
                color: 'var(--color-primary-light)',
                fontWeight: 600,
              }}
            >
              Về trang chủ
            </NavLink>
          </nav>
        </div>
      </aside>
      <div className="ns-admin-content">
        <Outlet />
      </div>
    </div>
  )
}
