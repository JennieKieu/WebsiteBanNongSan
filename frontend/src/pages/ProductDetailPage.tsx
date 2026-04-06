import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'
import api from '../api/client'
import { Container } from '../components/ui/Container'
import { ProductCard } from '../components/ui/ProductCard'
import { Button } from '../components/ui/Button'

type Product = {
  id: string
  name: string
  price: number
  description?: string
  stock: number
  imageUrl?: string
  imageUrls?: string[]
  useTags: string[]
}
type Recommended = { id: string; name: string; price: number; imageUrl?: string }

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [recommended, setRecommended] = useState<Recommended[]>([])
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string>('')

  useEffect(() => {
    if (!id) return
    api.get(`/products/${id}`).then((r) => setProduct(r.data))
    api.get(`/products/${id}/recommended`).then((r) => setRecommended(r.data))
  }, [id])

  useEffect(() => {
    if (!product) return
    const gallery = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
    setSelectedImage(gallery[0] || '')
  }, [product])

  const addToCart = () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    api.post('/cart/items', { productId: id, quantity: qty }).then(() => alert('Đã thêm vào giỏ hàng')).catch(() => alert('Vui lòng đăng nhập'))
  }

  if (!product) {
    return (
      <Container>
        <div className="ns-loading">Đang tải sản phẩm…</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="ns-pdetail">
        <div className="ns-pdetail__media">
          {selectedImage ? (
            <img src={selectedImage} alt={product.name} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
              Ảnh sản phẩm
            </div>
          )}
        </div>
        <div>
          <h1 className="ns-pdetail__title">{product.name}</h1>
          <p className="ns-pdetail__price">{product.price?.toLocaleString('vi-VN')}đ</p>
          {product.useTags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {product.useTags.map((t) => (
                <span key={t} className="ns-badge">
                  {t}
                </span>
              ))}
            </div>
          )}
          <p style={{ color: 'var(--color-text-muted)', margin: '0 0 var(--space-4)' }}>{product.description || 'Mô tả sản phẩm.'}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>Tồn kho: {product.stock}</p>
          <div className="ns-pdetail__actions">
            <input
              type="number"
              className="ns-input ns-pdetail__qty"
              min={1}
              max={product.stock}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              aria-label="Số lượng"
            />
            <Button type="button" onClick={addToCart}>
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </div>
      {(product.imageUrls?.length || product.imageUrl) ? (
        <div className="ns-pdetail__thumbs">
          {(product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []).map((img) => (
            <button
              key={img}
              type="button"
              className={`ns-pdetail__thumb ${selectedImage === img ? 'is-active' : ''}`}
              onClick={() => setSelectedImage(img)}
            >
              <img src={img} alt={product.name} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}

      {recommended.length > 0 && (
        <section className="ns-section" style={{ marginTop: 'var(--space-10)' }}>
          <h2 className="ns-section-head__title" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
            Sản phẩm gợi ý
          </h2>
          <div className="ns-grid-products">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}
