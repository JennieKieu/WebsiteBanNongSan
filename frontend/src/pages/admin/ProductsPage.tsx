import { useEffect, useMemo, useState } from 'react'
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  uploadAdminProductImage,
  updateAdminProduct,
} from '../../api/admin/products'
import { getAdminCategories } from '../../api/admin/categories'
import type { Category, Product } from '../../api/admin/types'
import { AdminTable } from '../../components/admin/AdminTable'
import { AdminSearchBar } from '../../components/admin/AdminSearchBar'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { Button } from '../../components/ui/Button'

const emptyForm: Partial<Product> = {
  name: '',
  categoryId: '',
  description: '',
  useTags: [],
  price: undefined,
  stock: undefined,
  imageUrl: '',
  imageUrls: [],
  imagePublicIds: [],
  isActive: true,
  isFeatured: false,
}

const normalizePayload = (p: Partial<Product>): Partial<Product> => ({
  ...p,
  price: p.price ?? 0,
  stock: p.stock ?? 0,
  useTags: p.useTags ?? [],
  imageUrls: p.imageUrls ?? [],
  imagePublicIds: p.imagePublicIds ?? [],
  imageUrl: p.imageUrl || p.imageUrls?.[0] || '',
})

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [form, setForm] = useState<Partial<Product>>(emptyForm)
  const [tagsText, setTagsText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const load = async () => {
    try {
      const [productsRes, catRes] = await Promise.all([
        getAdminProducts({ search, page, pageSize: 10 }),
        getAdminCategories(),
      ])
      setItems(productsRes.items)
      setTotal(productsRes.total)
      setCategories(catRes)
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không tải được dữ liệu sản phẩm.')
    }
  }

  useEffect(() => {
    void load()
  }, [page, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setTagsText('')
    setModalOpen(true)
  }

  const openEdit = (item: Product) => {
    const imageUrls = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []
    setEditingId(item.id)
    setForm({
      ...item,
      imageUrls,
      imageUrl: imageUrls[0] || item.imageUrl || '',
      imagePublicIds: item.imagePublicIds ?? [],
      useTags: item.useTags ?? [],
      description: item.description ?? '',
    })
    setTagsText((item.useTags ?? []).join(', '))
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setForm(emptyForm)
    setTagsText('')
    setEditingId(null)
  }

  const uploadImages = async (files: FileList | File[]) => {
    const uploaded = await Promise.all(Array.from(files).map((f) => uploadAdminProductImage(f)))
    return {
      urls: uploaded.map((u) => u.url),
      publicIds: uploaded.map((u) => u.publicId).filter(Boolean),
    }
  }

  const handleUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      setUploading(true)
      const { urls, publicIds } = await uploadImages(files)
      setForm((p) => ({
        ...p,
        imageUrl: (p.imageUrls?.length ? p.imageUrls[0] : urls[0]) || p.imageUrl,
        imageUrls: [...(p.imageUrls ?? []), ...urls],
        imagePublicIds: [...(p.imagePublicIds ?? []), ...publicIds],
      }))
      setError(null)
    } catch (e: any) {
      setError(e?.message || e?.response?.data?.error || 'Upload ảnh thất bại.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setForm((prev) => {
      const urls = (prev.imageUrls ?? []).filter((_, i) => i !== index)
      const ids = (prev.imagePublicIds ?? []).filter((_, i) => i !== index)
      return {
        ...prev,
        imageUrls: urls,
        imagePublicIds: ids,
        imageUrl: urls[0] || '',
      }
    })
  }

  const submitModal = async () => {
    const useTags = tagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = normalizePayload({
      ...form,
      useTags,
    })

    if (!payload.name || !payload.categoryId) {
      setError('Vui lòng nhập tên sản phẩm và chọn danh mục.')
      return
    }

    try {
      setSaving(true)
      if (editingId) await updateAdminProduct(editingId, payload)
      else await createAdminProduct(payload)
      closeModal()
      await load()
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể lưu sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Quản lý sản phẩm
      </h1>
      {error ? (
        <div className="ns-card" style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
        <AdminSearchBar value={search} onChange={(v) => { setPage(1); setSearch(v) }} placeholder="Tìm theo tên sản phẩm..." />
        <Button size="sm" onClick={openCreate}>
          + Thêm sản phẩm
        </Button>
      </div>

      <AdminTable
        items={items}
        columns={[
          { key: 'category', title: 'Danh mục', render: (x) => categoryMap.get(x.categoryId) || x.categoryName || '-' },
          { key: 'name', title: 'Tên', render: (x) => x.name },
          { key: 'price', title: 'Giá', render: (x) => (x.price ?? 0).toLocaleString('vi-VN') },
          { key: 'stock', title: 'Kho', render: (x) => x.stock ?? 0 },
          {
            key: 'image',
            title: 'Ảnh',
            render: (x) => (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(x.imageUrls?.length ? x.imageUrls : x.imageUrl ? [x.imageUrl] : []).slice(0, 4).map((img, idx) => (
                  <img key={`${x.id}-${idx}`} src={img} alt={x.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                ))}
              </div>
            ),
          },
          { key: 'active', title: 'Trạng thái', render: (x) => (x.isActive ? 'Đang bán' : 'Ẩn') },
          {
            key: 'actions',
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

      <AdminPagination page={page} pageSize={10} total={total} onPageChange={setPage} />

      {modalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.4)',
            zIndex: 200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <div className="ns-card" style={{ width: 'min(980px, 96vw)', maxHeight: '92vh', overflow: 'auto', padding: 'var(--space-5)' }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
            <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <select className="ns-select" value={form.categoryId ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input className="ns-input" placeholder="Tên sản phẩm" value={form.name ?? ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="ns-input" type="number" min={0} placeholder="Giá" value={form.price ?? ''} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value ? Number(e.target.value) : undefined }))} />
              <input className="ns-input" type="number" min={0} placeholder="Tồn kho" value={form.stock ?? ''} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value ? Number(e.target.value) : undefined }))} />
              <input
                className="ns-input"
                placeholder="Tags (phân tách dấu phẩy), ví dụ: giảm cân, đẹp da"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                style={{ gridColumn: '1 / -1' }}
              />
              <textarea
                className="ns-input"
                placeholder="Mô tả sản phẩm"
                value={form.description ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                style={{ gridColumn: '1 / -1' }}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <input type="file" accept="image/*" multiple onChange={(e) => void handleUpload(e.target.files)} />
                {uploading ? <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>Đang upload...</div> : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(form.imageUrls ?? []).map((img, idx) => (
                    <div key={`${img}-${idx}`} style={{ position: 'relative' }}>
                      <img src={img} alt={form.name || 'product'} style={{ width: 58, height: 58, borderRadius: 6, objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: '1px solid var(--color-border)',
                          background: '#fff',
                          color: 'var(--color-danger)',
                          cursor: 'pointer',
                          lineHeight: '14px',
                          padding: 0,
                          fontWeight: 700,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Đang bán
              </label>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
                Nổi bật
              </label>
            </div>
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={closeModal}>
                Hủy
              </Button>
              <Button onClick={submitModal} disabled={saving}>
                {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        message={`Xóa sản phẩm "${deleting?.name ?? ''}"?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await deleteAdminProduct(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
