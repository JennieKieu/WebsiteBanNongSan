import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineClipboardDocumentList,
  HiOutlineChevronRight,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineEyeSlash,
  HiOutlineEye,
} from "react-icons/hi2";
import { useApi } from "../hooks/useApi";
import { useAuthStore } from "../store/useAuthStore";
import http from "../api/http";
import { formatDateVN } from "../utils/vnDatetime";

const statusLabels: Record<string, string> = {
  Pending: "Mới đặt",
  Confirmed: "Đã xác nhận",
  Packing: "Đang đóng gói",
  Shipping: "Đang giao",
  Delivered: "Đã giao thành công",
  DeliveryFailed: "Giao thất bại",
  RetryDelivery: "Giao lại",
  Cancelled: "Đã hủy",
};

const statusColors: Record<string, string> = {
  Pending: "badge-orange",
  Confirmed: "badge-blue",
  Packing: "badge-blue",
  Shipping: "badge-blue",
  Delivered: "badge-green",
  DeliveryFailed: "badge-red",
  RetryDelivery: "badge-orange",
  Cancelled: "badge-red",
};

type Tab = "profile" | "orders";

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "orders" ? "orders" : "profile";

  const { data: orders, loading: ordersLoading } = useApi<any[]>("/orders/my-orders", []);

  /* Profile edit */
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", ok: false });

  function startEdit() {
    setProfileForm({ name: user?.name || "", phone: (user as any)?.phone || "" });
    setProfileMsg({ text: "", ok: false });
    setEditing(true);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileMsg({ text: "Họ tên không được để trống", ok: false });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ text: "", ok: false });
    try {
      const res = await http.put("/auth/profile", {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      updateUser({ name: res.data.data.name, phone: res.data.data.phone });
      setProfileMsg({ text: "Cập nhật thành công!", ok: true });
      setEditing(false);
    } catch (err: any) {
      setProfileMsg({ text: err.response?.data?.message || "Cập nhật thất bại", ok: false });
    } finally {
      setProfileSaving(false);
    }
  }

  /* Password change */
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: "", ok: false });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg({ text: "", ok: false });
    if (!pwForm.current || !pwForm.newPw) {
      setPwMsg({ text: "Vui lòng nhập đầy đủ", ok: false });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ text: "Mật khẩu mới phải có ít nhất 6 ký tự", ok: false });
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ text: "Xác nhận mật khẩu không khớp", ok: false });
      return;
    }
    setPwSaving(true);
    try {
      await http.put("/auth/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwMsg({ text: "Đổi mật khẩu thành công!", ok: true });
      setPwForm({ current: "", newPw: "", confirm: "" });
      setShowPwForm(false);
    } catch (err: any) {
      setPwMsg({ text: err.response?.data?.message || "Đổi mật khẩu thất bại", ok: false });
    } finally {
      setPwSaving(false);
    }
  }

  function goToTab(next: Tab) {
    if (next === "orders") {
      setSearchParams({ tab: "orders" });
    } else {
      setSearchParams({});
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Thông tin cá nhân", icon: <HiOutlineUser /> },
    { key: "orders", label: "Đơn hàng của tôi", icon: <HiOutlineClipboardDocumentList /> },
  ];

  return (
    <div className="account-layout">
      <aside className="account-sidebar">
        <div className="account-avatar">
          <div className="avatar-circle">
            <HiOutlineUser />
          </div>
          <div>
            <strong>{user?.name || "Khách hàng"}</strong>
            <p className="text-muted" style={{ fontSize: "0.8125rem" }}>{user?.email}</p>
          </div>
        </div>
        <nav className="account-nav">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`account-nav-item ${tab === t.key ? "active" : ""}`}
              onClick={() => goToTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="account-content">
        {tab === "profile" && (
          <div className="stack">
            <div className="row-between">
              <h2>Thông tin cá nhân</h2>
              {!editing && (
                <button type="button" className="btn btn-outline btn-sm" onClick={startEdit}>
                  <HiOutlinePencilSquare /> Chỉnh sửa
                </button>
              )}
            </div>

            {profileMsg.text && (
              <div className={profileMsg.ok ? "success-box" : "error-box"}>
                {profileMsg.text}
              </div>
            )}

            <div className="card" style={{ padding: 24 }}>
              {!editing ? (
                <div className="stack">
                  <div className="account-field">
                    <span className="account-field-label">Họ tên</span>
                    <span className="account-field-value">{user?.name || "—"}</span>
                  </div>
                  <div className="account-field">
                    <span className="account-field-label">Email</span>
                    <span className="account-field-value">{user?.email || "—"}</span>
                  </div>
                  <div className="account-field">
                    <span className="account-field-label">Số điện thoại</span>
                    <span className="account-field-value">{(user as any)?.phone || "Chưa cập nhật"}</span>
                  </div>
                  <div className="account-field">
                    <span className="account-field-label">Vai trò</span>
                    <span className="account-field-value">
                      <span className={`badge ${user?.role === "Admin" ? "badge-blue" : "badge-green"}`}>
                        {user?.role === "Admin" ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <form className="stack" onSubmit={saveProfile}>
                  <div className="form-group">
                    <label className="form-label">Họ tên *</label>
                    <input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input value={user?.email || ""} disabled style={{ opacity: 0.6 }} />
                    <small className="text-muted">Email không thể thay đổi</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="0912 345 678"
                    />
                  </div>
                  <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setEditing(false); setProfileMsg({ text: "", ok: false }); }}
                      disabled={profileSaving}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn" disabled={profileSaving}>
                      <HiOutlineCheckCircle />
                      {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Change password section */}
            <div className="row-between" style={{ marginTop: 8 }}>
              <h2>Mật khẩu</h2>
              {!showPwForm && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => { setShowPwForm(true); setPwMsg({ text: "", ok: false }); setPwForm({ current: "", newPw: "", confirm: "" }); }}
                >
                  <HiOutlineLockClosed /> Đổi mật khẩu
                </button>
              )}
            </div>

            {pwMsg.text && (
              <div className={pwMsg.ok ? "success-box" : "error-box"}>
                {pwMsg.text}
              </div>
            )}

            {showPwForm && (
              <div className="card" style={{ padding: 24 }}>
                <form className="stack" onSubmit={changePassword}>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu hiện tại *</label>
                    <div className="input-password-wrap">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={pwForm.current}
                        onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="input-password-toggle"
                        onClick={() => setShowCurrent((v) => !v)}
                        tabIndex={-1}
                      >
                        {showCurrent ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu mới * (ít nhất 6 ký tự)</label>
                    <div className="input-password-wrap">
                      <input
                        type={showNew ? "text" : "password"}
                        value={pwForm.newPw}
                        onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="input-password-toggle"
                        onClick={() => setShowNew((v) => !v)}
                        tabIndex={-1}
                      >
                        {showNew ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Xác nhận mật khẩu mới *</label>
                    <input
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setShowPwForm(false); setPwMsg({ text: "", ok: false }); }}
                      disabled={pwSaving}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn" disabled={pwSaving}>
                      <HiOutlineCheckCircle />
                      {pwSaving ? "Đang đổi..." : "Đổi mật khẩu"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showPwForm && !pwMsg.text && (
              <p className="text-muted" style={{ fontSize: "0.8125rem" }}>
                Bấm "Đổi mật khẩu" để thay đổi mật khẩu đăng nhập.
              </p>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="stack">
            <h2>Đơn hàng của tôi</h2>
            {ordersLoading ? (
              <div className="loading-spinner">Đang tải đơn hàng...</div>
            ) : !orders?.length ? (
              <div className="empty-state">
                <HiOutlineClipboardDocumentList />
                <p>Bạn chưa có đơn hàng nào</p>
                <Link to="/shop" className="btn">Mua sắm ngay</Link>
              </div>
            ) : (
              <div className="stack">
                {orders.map((order: any) => (
                  <Link key={order._id} to={`/orders/${order._id}`} className="order-row">
                    <div className="order-row-left">
                      <strong>{order.orderCode}</strong>
                      <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                        {formatDateVN(order.createdAt)} · {order.items?.length || 0} sản phẩm
                      </span>
                    </div>
                    <div className="order-row-right">
                      <span className={`badge ${statusColors[order.status] || "badge-gray"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      <strong style={{ color: "var(--c-primary)" }}>
                        {(order.total || 0).toLocaleString("vi-VN")}₫
                      </strong>
                      <HiOutlineChevronRight style={{ color: "var(--c-text-muted)" }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
