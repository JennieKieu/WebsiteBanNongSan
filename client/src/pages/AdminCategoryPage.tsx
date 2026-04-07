import { useEffect, useMemo, useState } from "react";
import {
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineTag,
} from "react-icons/hi2";
import { RiLeafLine } from "react-icons/ri";
import toast from "react-hot-toast";
import http from "../api/http";
import Pagination from "../components/Pagination";
import AdminListToolbar from "../components/AdminListToolbar";
import { formatDateVN } from "../utils/vnDatetime";

type Category = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  name: string;
  slug: string;
  isActive: boolean;
};

const EMPTY_FORM: FormData = { name: "", slug: "", isActive: true };

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
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

  const filteredCategories = useMemo(() => {
    let list = categories.slice();
    if (filterActive === "on") list = list.filter((c) => c.isActive);
    if (filterActive === "off") list = list.filter((c) => !c.isActive);
    const q = listSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, listSearch, filterActive]);

  useEffect(() => {
    setPage(1);
  }, [listSearch, filterActive]);

  useEffect(() => {
    const tp = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
    setPage((p) => (p > tp ? tp : p));
  }, [filteredCategories.length]);

  async function fetchCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/categories");
      setCategories(res.data.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditId(c._id);
    setForm({ name: c.name, slug: c.slug, isActive: c.isActive });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  function handleNameChange(val: string) {
    const autoSlug = editId ? form.slug : toSlug(val);
    setForm({ ...form, name: val, slug: autoSlug });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim(), isActive: form.isActive };
      if (editId) {
        await http.put(`/admin/categories/${editId}`, body);
      } else {
        await http.post("/admin/categories", body);
      }
      closeForm();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await http.delete(`/admin/categories/${id}`);
      setDeleteConfirm(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  }

  return (
    <div className="stack-lg">
      <div className="row-between">
        <h1><HiOutlineTag style={{ verticalAlign: "middle", color: "var(--c-primary)" }} /> Quản lý danh mục</h1>
        <button className="btn" onClick={openCreate}>
          <HiOutlinePlusCircle /> Thêm danh mục
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!loading && categories.length > 0 && (
        <AdminListToolbar
          search={listSearch}
          onSearchChange={setListSearch}
          placeholder="Tên danh mục, slug..."
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
              <h3>{editId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h3>
              <button className="btn-ghost" onClick={closeForm}><HiOutlineXMark /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body stack">
              <div className="form-group">
                <label className="form-label">Tên danh mục *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="VD: Rau củ"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="VD: rau-cu"
                />
                <span className="form-helper">Tự sinh từ tên danh mục. Có thể chỉnh tay.</span>
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--c-primary)" }}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Hiển thị cho khách hàng</span>
                </label>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Huỷ</button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo"}
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
              <h3>Xoá danh mục này?</h3>
              <p className="text-muted" style={{ margin: "8px 0 20px" }}>Sản phẩm thuộc danh mục sẽ không bị xoá nhưng sẽ không còn phân loại.</p>
              <div className="row" style={{ justifyContent: "center", gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Huỷ</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Xoá</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-spinner">Đang tải danh sách...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <RiLeafLine />
          <p>Chưa có danh mục nào.</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0 }}>
            Không có danh mục khớp bộ lọc.{" "}
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
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <RiLeafLine style={{ color: "var(--c-primary)" }} /> {c.name}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>{c.slug}</td>
                  <td>
                    <span className={`badge ${c.isActive ? "badge-green" : "badge-gray"}`}>
                      {c.isActive ? "Hiển thị" : "Đã ẩn"}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: "0.8125rem" }}>
                    {formatDateVN(c.createdAt)}
                  </td>
                  <td>
                    <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                      <button className="btn-icon" title="Sửa" onClick={() => openEdit(c)}>
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        className="btn-icon"
                        title="Xoá"
                        style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                        onClick={() => setDeleteConfirm(c._id)}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCategories.length > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={Math.ceil(filteredCategories.length / PAGE_SIZE)}
          onPageChange={setPage}
          totalItems={filteredCategories.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
