import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'
import api from '../api/client'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'

type CartItem = { productId: string; productName: string; imageUrl?: string; price: number; quantity: number }

export default function CartPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) api.get('/cart').then((r) => setItems(r.data?.items ?? []))
  }, [user])

  const updateQty = (productId: string, qty: number) => {
    api.put(`/cart/items/${productId}`, { quantity: qty }).then((r) => setItems(r.data?.items ?? []))
  }

  const removeItem = (productId: string) => {
    api.delete(`/cart/items/${productId}`).then((r) => setItems(r.data?.items ?? []))
  }

  const checkout = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await api.post('/orders', { shippingAddress: address })
      alert(`Đặt hàng thành công! Mã đơn: ${data.id}`)
      setItems([])
      setAddress('')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error ?? 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  if (!user) {
    return (
      <Container>
        <div className="ns-empty">
          <p>Vui lòng đăng nhập để xem giỏ hàng.</p>
          <p>
            <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </Container>
    )
  }

  if (items.length === 0) {
    return (
      <Container>
        <div className="ns-empty">
          <h2 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
            Giỏ hàng trống
          </h2>
          <Link to="/products">Mua sắm ngay</Link>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-6)' }}>
        Giỏ hàng
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {items.map((i) => (
          <div key={i.productId} className="ns-cart-row">
            <div className="ns-cart-row__thumb">{i.imageUrl ? <img src={i.imageUrl} alt="" /> : null}</div>
            <div className="ns-cart-row__info">
              <Link to={`/products/${i.productId}`} style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                {i.productName}
              </Link>
              <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-primary)', fontWeight: 700 }}>
                {i.price?.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <div className="ns-cart-row__qty">
              <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => updateQty(i.productId, Math.max(1, i.quantity - 1))}>
                −
              </button>
              <span style={{ minWidth: 24, textAlign: 'center' }}>{i.quantity}</span>
              <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" onClick={() => updateQty(i.productId, i.quantity + 1)}>
                +
              </button>
            </div>
            <button type="button" className="ns-btn ns-btn--ghost ns-btn--sm" style={{ color: 'var(--color-danger)' }} onClick={() => removeItem(i.productId)}>
              Xóa
            </button>
          </div>
        ))}
      </div>
      <div className="ns-card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div className="ns-field">
          <label className="ns-label" htmlFor="ship-addr">
            Địa chỉ giao hàng
          </label>
          <input
            id="ship-addr"
            className="ns-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ đầy đủ"
          />
        </div>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 var(--space-4)' }}>
          Tổng: {total.toLocaleString('vi-VN')}đ
        </p>
        <Button type="button" onClick={checkout} disabled={loading} block>
          {loading ? 'Đang xử lý…' : 'Thanh toán (mock)'}
        </Button>
      </div>
    </Container>
  )
}
