import { useEffect, useState } from 'react'
import { createAdminBanner, deleteAdminBanner, getAdminBanners, updateAdminBanner } from '../../api/admin/banners'
import type { Banner } from '../../api/admin/types'
import { AdminTable } from '../../components/admin/AdminTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { Button } from '../../components/ui/Button'

const emptyForm: Partial<Banner> = { title: '', imageUrl: '', linkUrl: '', order: 0, isActive: true }

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([])
  const [form, setForm] = useState<Partial<Banner>>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Banner | null>(null)

  const load = async () => {
    setItems(await getAdminBanners())
  }

  useEffect(() => {
    void load()
  }, [])

  const submit = async () => {
    if (!form.imageUrl) return
    if (editingId) await updateAdminBanner(editingId, form)
    else await createAdminBanner(form)
    setForm(emptyForm)
    setEditingId(null)
    await load()
  }

  return (
    <div>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Quản lý banner
      </h1>

      <AdminTable
        items={items}
        columns={[
          { key: 'title', title: 'Tiêu đề', render: (x) => x.title || '-' },
          { key: 'image', title: 'Ảnh', render: (x) => <a href={x.imageUrl} target="_blank" rel="noreferrer">Xem ảnh</a> },
          { key: 'order', title: 'Thứ tự', render: (x) => x.order },
          { key: 'active', title: 'Trạng thái', render: (x) => (x.isActive ? 'Hiển thị' : 'Ẩn') },
          {
            key: 'action',
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
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Cập nhật banner' : 'Thêm banner'}</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <input className="ns-input" placeholder="Tiêu đề" value={form.title ?? ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <input className="ns-input" placeholder="URL ảnh" value={form.imageUrl ?? ''} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
          <input className="ns-input" placeholder="Link điều hướng" value={form.linkUrl ?? ''} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} />
          <input className="ns-input" type="number" placeholder="Thứ tự" value={form.order ?? 0} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} />
          <select className="ns-select" value={form.isActive ? '1' : '0'} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === '1' }))}>
            <option value="1">Hiển thị</option>
            <option value="0">Ẩn</option>
          </select>
        </div>
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8 }}>
          <Button onClick={submit}>{editingId ? 'Lưu thay đổi' : 'Thêm mới'}</Button>
          {editingId ? (
            <Button variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm) }}>
              Hủy sửa
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        message={`Xóa banner "${deleting?.title ?? deleting?.id ?? ''}"?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          await deleteAdminBanner(deleting.id)
          setDeleting(null)
          await load()
        }}
      />
    </div>
  )
}
