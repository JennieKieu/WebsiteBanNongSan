import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  RiContactsBook3Line,
  RiCoupon2Line,
  RiDashboardLine,
  RiFileChartLine,
  RiShoppingBasket2Line,
  RiMenuLine,
  RiCloseLine,
} from "react-icons/ri";
import { TbBoxModel2 } from "react-icons/tb";
import {
  HiOutlineUsers,
  HiOutlinePhoto,
  HiOutlineTag,
  HiOutlineChartBarSquare,
  HiOutlineUserCircle,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import NotificationBell from "../components/NotificationBell";
import { useAuthStore } from "../store/useAuthStore";

const menu = [
  { label: "Tổng quan", path: "/admin", icon: <RiDashboardLine /> },
  { label: "Banner", path: "/admin/banners", icon: <HiOutlinePhoto /> },
  { label: "Danh mục", path: "/admin/categories", icon: <HiOutlineTag /> },
  { label: "Sản phẩm", path: "/admin/products", icon: <RiShoppingBasket2Line /> },
  { label: "Lô hàng", path: "/admin/batches", icon: <TbBoxModel2 /> },
  { label: "Đơn hàng", path: "/admin/orders", icon: <RiFileChartLine /> },
  { label: "Khách hàng", path: "/admin/customers", icon: <HiOutlineUsers /> },
  { label: "Liên hệ", path: "/admin/contacts", icon: <RiContactsBook3Line /> },
  { label: "Mã giảm giá", path: "/admin/coupons", icon: <RiCoupon2Line /> },
  { label: "Báo cáo", path: "/admin/reports", icon: <HiOutlineChartBarSquare /> },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function isActive(path: string) {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  }

  const sidebar = (
    <>
      <div className="admin-sidebar-brand">
        <img src="https://res.cloudinary.com/dpigoorhc/image/upload/v1775490823/Logo_ihg1b0.png" alt="Logo" style={{ height: 46 }} />
      </div>
      {menu.map((m) => (
        <Link
          key={m.path}
          to={m.path}
          className={`admin-nav-item ${isActive(m.path) ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        >
          {m.icon} {m.label}
        </Link>
      ))}
      <Link
        to="/"
        className="admin-nav-item"
        style={{ marginTop: "auto", opacity: 0.7 }}
        onClick={() => setSidebarOpen(false)}
      >
        ← Về cửa hàng
      </Link>
    </>
  );

  return (
    <div className="admin-shell">
      {/* Desktop sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 299, background: "rgba(0,0,0,0.4)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-workspace">
        <div className="admin-topbar">
          <button className="admin-toggle-btn admin-toggle-mobile" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
            <RiMenuLine />
          </button>
          <span className="admin-topbar-title">Quản trị</span>
          <div className="admin-topbar-actions">
            <NotificationBell />
            <div className="admin-user-menu-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="admin-user-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="Menu tài khoản"
              >
                <HiOutlineUserCircle />
                <span className="admin-user-name">{user?.name || "Admin"}</span>
              </button>
              {userMenuOpen && (
                <div className="admin-user-dropdown">
                  <Link
                    to="/account"
                    className="admin-user-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <HiOutlineUserCircle /> Quản lý tài khoản
                  </Link>
                  <button
                    type="button"
                    className="admin-user-dropdown-item admin-user-dropdown-logout"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <HiOutlineArrowRightOnRectangle /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
          {sidebarOpen && (
            <button className="admin-toggle-btn admin-toggle-mobile" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">
              <RiCloseLine />
            </button>
          )}
        </div>
        <section className="admin-main">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
