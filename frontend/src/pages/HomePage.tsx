import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Flag, Leaf, Sprout, Truck } from '../components/icons'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ProductCard } from '../components/ui/ProductCard'

type Product = { id: string; name: string; price: number; imageUrl?: string; slug: string }
type Banner = { id: string; imageUrl: string; linkUrl?: string; productId?: string }
type Category = { id: string; name: string; slug: string }

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    api.get('/banners').then((r) => setBanners(r.data))
    api.get('/categories').then((r) => setCategories(r.data))
    api.get('/products/featured?limit=8').then((r) => setProducts(r.data))
  }, [])

  return (
    <Container>
      <section className="ns-section">
        <div className="ns-banner">
          {banners.length > 0 ? (
            <div className="ns-banner__track" role="region" aria-label="Banner quảng cáo">
              {banners.map((b) =>
                b.productId ? (
                  <Link key={b.id} to={`/products/${b.productId}`} className="ns-banner__slide">
                    <img src={b.imageUrl} alt="" />
                  </Link>
                ) : (
                  <a key={b.id} className="ns-banner__slide" href={b.linkUrl || '#'}>
                    <img src={b.imageUrl} alt="" />
                  </a>
                ),
              )}
            </div>
          ) : (
            <div className="ns-banner__placeholder">Banner quảng cáo — thêm ảnh trong Admin</div>
          )}
        </div>
      </section>

      <section className="ns-section">
        <SectionHeading title="Danh mục nổi bật" description="Chọn nhóm nông sản phù hợp với nhu cầu gia đình." />
        <div className="ns-grid-categories">
          {categories.length > 0 ? (
            categories.map((c) => (
              <Link key={c.id} to={`/products?category=${c.id}`} className="ns-cat-tile">
                <span className="ns-cat-tile__icon" aria-hidden>
                  <Sprout size={32} strokeWidth={1.75} />
                </span>
                <span className="ns-cat-tile__label">{c.name}</span>
              </Link>
            ))
          ) : (
            ['Trái cây sấy, mứt', 'Bánh mứt, đồ khô', 'Trà, cà phê', 'Nông sản, dược liệu'].map((n, i) => (
              <div key={i} className="ns-cat-tile" style={{ pointerEvents: 'none' }}>
                <span className="ns-cat-tile__icon" aria-hidden>
                  <Sprout size={32} strokeWidth={1.75} />
                </span>
                <span className="ns-cat-tile__label">{n}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="ns-section">
        <SectionHeading title="Sản phẩm nổi bật" description="Được khách hàng tin chọn nhiều nhất." />
        <div className="ns-grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="ns-section">
        <div className="ns-grid-3">
          <div className="ns-value-card">
            <div className="ns-value-card__icon" aria-hidden>
              <Truck size={36} strokeWidth={1.75} />
            </div>
            <h3 className="ns-value-card__title">Miễn phí vận chuyển</h3>
            <p className="ns-value-card__text">Đơn hàng từ 490.000đ</p>
          </div>
          <div className="ns-value-card">
            <div className="ns-value-card__icon" aria-hidden>
              <Leaf size={36} strokeWidth={1.75} />
            </div>
            <h3 className="ns-value-card__title">Nông sản chất lượng</h3>
            <p className="ns-value-card__text">Từ vườn nhà đến tay bạn</p>
          </div>
          <div className="ns-value-card">
            <div className="ns-value-card__icon" aria-hidden>
              <Flag size={36} strokeWidth={1.75} />
            </div>
            <h3 className="ns-value-card__title">Thương hiệu thuần Việt</h3>
            <p className="ns-value-card__text">Natural Store</p>
          </div>
        </div>
      </section>
    </Container>
  )
}
