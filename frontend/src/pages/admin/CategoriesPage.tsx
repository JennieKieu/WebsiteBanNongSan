import { useEffect, useState } from 'react'
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../api/admin/categories'
import type { Category } from '../../api/admin/types'
import { AdminSearchBar } from '../../components/admin/AdminSearchBar'
import { AdminTable } from '../../components/admin/AdminTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { Button } from '../../components/ui/Button'

const emptyForm: Partial<Category> = { name: '', slug: '', order: 0, isActive: true }

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Partial<Category>>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const load = async () => {
    const data = await getAdminCategories(search ? { search } : undefined)
    setItems(data)
  }

  useEffect(() => {
    void load()
  }, [search])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const submit = async () => {
    if (!form.name) return
    if (editingId) await updateAdminCategory(editingId, form)
    else await createAdminCategory(form)
    resetForm()
    await load()
  }

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Quản lý danh mục
      </h1>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên danh mục..." />
      </div>

      <AdminTable
        items={items}
        columns={[
          { key: 'name', title: 'Tên danh mục', render: (x) => x.name },
          { key: 'slug', title: 'Slug', render: (x) => x.slug },
          { key: 'order', title: 'Thứ tự', render: (x) => x.order },
          { key: 'active', title: 'Trạng thái', render: (x) => (x.isActive ? 'Hiển thị' : 'Ẩn') },
          {
            key: 'actions',
            title: 'Thao tác',
            render: (x) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="ghost" onClick={() => { setEditingId(x.id); setForm(x) }}>
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

      <div className="ns-card" style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)' }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <input className="ns-input" placeholder="Tên danh mục" value={form.name ?? ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input className="ns-input" placeholder="Slug (để trống sẽ tự tạo)" value={form.slug ?? ''} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
          <input className="ns-input" type="number" placeholder="Thứ tự" value={form.order ?? 0} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} />
          <select className="ns-select" value={form.isActive ? '1' : '0'} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === '1' }))}>
            <option value="1">Hiển thị</option>
            <option value="0">Ẩn</option>
          </select>
        </div>
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8 }}>
          <Button onClick={submit}>{editingId ? 'Lưu thay đổi' : 'Thêm mới'}</Button>
          {editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Hủy sửa
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        message={`Xóa danh mục "${deleting?.name ?? ''}"?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await deleteAdminCategory(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
