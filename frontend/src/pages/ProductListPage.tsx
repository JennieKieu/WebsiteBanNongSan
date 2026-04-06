import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ProductCard } from '../components/ui/ProductCard'
import { Button } from '../components/ui/Button'
import { useMediaQuery } from '../hooks/useMediaQuery'

type Product = { id: string; name: string; price: number; imageUrl?: string }
type Category = { id: string; name: string }

export default function ProductListPage() {
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 900px)')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '')
  const [useTag, setUseTag] = useState(searchParams.get('use') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data))
  }, [])

  useEffect(() => {
    const s = searchParams.get('search')
    const c = searchParams.get('category')
    if (s != null) setSearch(s)
    if (c != null) setCategoryId(c)
  }, [searchParams])

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), pageSize: '12' }
    if (search) params.search = search
    if (categoryId) params.categoryId = categoryId
    if (useTag) params.useTag = useTag
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    api.get('/products', { params }).then((r) => {
      setProducts(r.data.items)
      setTotal(r.data.total)
    })
  }, [search, categoryId, useTag, minPrice, maxPrice, page])

  useEffect(() => {
    if (isDesktop) setFiltersOpen(false)
  }, [isDesktop])

  const useTags = ['giảm cân', 'đẹp da', 'tiểu đường', 'tăng cường miễn dịch', 'sinh tố']

  const filterBody = (
    <>
      <div className="ns-field">
        <label className="ns-label" htmlFor="pl-search">
          Từ khóa
        </label>
        <input
          id="pl-search"
          className="ns-input"
          placeholder="Tìm sản phẩm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="ns-field">
        <label className="ns-label" htmlFor="pl-cat">
          Danh mục
        </label>
        <select
          id="pl-cat"
          className="ns-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Tất cả</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="ns-field">
        <label className="ns-label" htmlFor="pl-use">
          Công dụng
        </label>
        <select id="pl-use" className="ns-select" value={useTag} onChange={(e) => setUseTag(e.target.value)}>
          <option value="">Tất cả</option>
          {useTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="ns-field">
        <label className="ns-label" htmlFor="pl-min">
          Giá từ (đ)
        </label>
        <input
          id="pl-min"
          className="ns-input"
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="ns-field">
        <label className="ns-label" htmlFor="pl-max">
          Giá đến (đ)
        </label>
        <input
          id="pl-max"
          className="ns-input"
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder=""
        />
      </div>
    </>
  )

  const sidebarClass =
    'ns-layout-products__sidebar ns-filter-panel--mobile-hidden' +
    (!isDesktop && filtersOpen ? ' is-open' : '')

  return (
    <Container>
      <SectionHeading
        title="Sản phẩm"
        align="left"
        description={`${total.toLocaleString('vi-VN')} sản phẩm phù hợp bộ lọc`}
      />

      <div className="ns-filter-toggle">
        <Button type="button" variant="secondary" block onClick={() => setFiltersOpen((o) => !o)}>
          {filtersOpen ? 'Ẩn bộ lọc' : 'Bộ lọc & tìm kiếm'}
        </Button>
      </div>

      <div className="ns-layout-products">
        <aside className={sidebarClass} aria-label="Bộ lọc sản phẩm">
          <div className="ns-filter">
            <h3 className="ns-filter__title">Bộ lọc</h3>
            {filterBody}
          </div>
        </aside>

        <div className="ns-layout-products__main">
          <div className="ns-grid-products">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {products.length === 0 ? (
            <div className="ns-empty">Không có sản phẩm nào. Hãy thử đổi bộ lọc.</div>
          ) : null}

          <div className="ns-pagination">
            <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <span className="ns-badge">Trang {page}</span>
            <Button type="button" variant="ghost" disabled={page * 12 >= total} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
