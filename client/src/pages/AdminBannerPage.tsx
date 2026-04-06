import { useEffect, useMemo, useState } from "react";
import {
  HiOutlinePhoto,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiOutlineXMark,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";
import http from "../api/http";
import ImageUpload from "../components/ImageUpload";
import Pagination from "../components/Pagination";
import { formatDateTimeVN } from "../utils/vnDatetime";
import AdminListToolbar from "../components/AdminListToolbar";

type ImageData = { secure_url: string; public_id?: string };

type Banner = {
  _id: string;
  title: string;
  image?: ImageData;
  link: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  title: string;
  image: ImageData | null;
  link: string;
  isActive: boolean;
};

const EMPTY_FORM: FormData = { title: "", image: null, link: "", isActive: true };

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const PAGE_SIZE = 20;

  const filteredBanners = useMemo(() => {
    let list = banners.slice();
    if (filterActive === "on") list = list.filter((b) => b.isActive);
    if (filterActive === "off") list = list.filter((b) => !b.isActive);
    const q = listSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.link || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [banners, listSearch, filterActive]);

  useEffect(() => {
    setPage(1);
  }, [listSearch, filterActive]);

  useEffect(() => {
    const tp = Math.ceil(filteredBanners.length / PAGE_SIZE) || 1;
    setPage((p) => (p > tp ? tp : p));
  }, [filteredBanners.length]);

  async function fetchBanners() {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/banners");
      setBanners(res.data.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditId(b._id);
    setForm({
      title: b.title,
      image: b.image || null,
      link: b.link || "",
      isActive: b.isActive,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body: any = {
        title: form.title.trim(),
        link: form.link.trim(),
        isActive: form.isActive,
      };
      if (form.image) {
        body.image = form.image;
      }
      if (editId) {
        await http.put(`/admin/banners/${editId}`, body);
      } else {
        await http.post("/admin/banners", body);
      }
      closeForm();
      fetchBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const banner = banners.find((b) => b._id === id);
      if (banner?.image?.public_id) {
        await http.post("/admin/delete-image", { public_id: banner.image.public_id }).catch(() => {});
      }
      await http.delete(`/admin/banners/${id}`);
      setDeleteConfirm(null);
      fetchBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  }

  async function toggleActive(b: Banner) {
    try {
      await http.put(`/admin/banners/${b._id}`, { isActive: !b.isActive });
      fetchBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  }

  return (
    <div className="stack-lg">
      <div className="row-between">
        <h1><HiOutlinePhoto style={{ verticalAlign: "middle", color: "var(--c-primary)" }} /> Quản lý Banner</h1>
        <button className="btn" onClick={openCreate}>
          <HiOutlinePlusCircle /> Thêm banner
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!loading && banners.length > 0 && (
        <AdminListToolbar
          search={listSearch}
          onSearchChange={setListSearch}
          placeholder="Tiêu đề banner, đường dẫn..."
        >
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="admin-filter-select"
            aria-label="Hiển thị"
          >
            <option value="">Tất cả</option>
            <option value="on">Đang hiển thị</option>
            <option value="off">Đang ẩn</option>
          </select>
        </AdminListToolbar>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Chỉnh sửa banner" : "Thêm banner mới"}</h3>
              <button className="btn-ghost" onClick={closeForm}><HiOutlineXMark /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body stack">
              <div className="form-group">
                <label className="form-label">Tiêu đề banner *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Khuyến mãi mùa hè"
                  required
                />
              </div>
              <ImageUpload
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
                folder="banners"
                label="Ảnh banner"
              />
              <div className="form-group">
                <label className="form-label"><HiOutlineLink style={{ verticalAlign: "middle" }} /> Đường dẫn liên kết</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="VD: /shop?keyword=khuyen-mai"
                />
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--c-primary)" }}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Hiển thị trên trang chủ</span>
                </label>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Huỷ</button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: "center", padding: "32px 24px" }}>
              <HiOutlineTrash style={{ fontSize: "2.5rem", color: "var(--c-error)", marginBottom: 12 }} />
              <h3>Xoá banner này?</h3>
              <p className="text-muted" style={{ margin: "8px 0 20px" }}>Ảnh trên Cloudinary cũng sẽ bị xoá.</p>
              <div className="row" style={{ justifyContent: "center", gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Huỷ</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Xoá</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner list */}
      {loading ? (
        <div className="loading-spinner">Đang tải danh sách banner...</div>
      ) : banners.length === 0 ? (
        <div className="empty-state">
          <HiOutlinePhoto />
          <p>Chưa có banner nào. Nhấn "Thêm banner" để bắt đầu.</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0 }}>
            Không có banner khớp bộ lọc.{" "}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setListSearch("");
                setFilterActive("");
              }}
            >
              Xóa bộ lọc
            </button>
          </p>
        </div>
      ) : (
        <div className="banner-admin-grid">
          {filteredBanners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((b) => (
            <div key={b._id} className={`banner-admin-card ${!b.isActive ? "inactive" : ""}`}>
              <div className="banner-admin-img">
                <img
                  src={b.image?.secure_url || "https://placehold.co/600x200/E8F5E9/2E7D32?text=Banner"}
                  alt={b.title}
                />
                {!b.isActive && (
                  <span className="badge badge-gray banner-admin-badge">Đã ẩn</span>
                )}
              </div>
              <div className="banner-admin-info">
                <h4>{b.title}</h4>
                {b.link && (
                  <span className="text-muted" style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: 4 }}>
                    <HiOutlineLink /> {b.link}
                  </span>
                )}
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Cập nhật: {formatDateTimeVN(b.updatedAt)}
                </span>
              </div>
              <div className="banner-admin-actions">
                <button
                  className="btn-icon"
                  title={b.isActive ? "Ẩn banner" : "Hiện banner"}
                  onClick={() => toggleActive(b)}
                >
                  {b.isActive ? <HiOutlineEye /> : <HiOutlineEyeSlash />}
                </button>
                <button className="btn-icon" title="Sửa" onClick={() => openEdit(b)}>
                  <HiOutlinePencilSquare />
                </button>
                <button
                  className="btn-icon"
                  title="Xoá"
                  style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                  onClick={() => setDeleteConfirm(b._id)}
                >
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredBanners.length > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={Math.ceil(filteredBanners.length / PAGE_SIZE)}
          onPageChange={setPage}
          totalItems={filteredBanners.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
