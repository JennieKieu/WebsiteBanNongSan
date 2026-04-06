import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRightOnRectangle,
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { RiLeafLine, RiPlantLine, RiSeedlingLine, RiApps2Line, RiShieldCheckLine } from "react-icons/ri";
import {
  GiGrapes,
  GiWheat,
  GiMushroomGills,
  GiHerbsBundle,
} from "react-icons/gi";
import { useAuthStore } from "../store/useAuthStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";
import { useApi } from "../hooks/useApi";
import NotificationBell from "./NotificationBell";

const iconMap: Record<string, React.ReactNode> = {
  rau: <RiSeedlingLine />,
  qua: <GiGrapes />,
  "ngu-coc": <GiWheat />,
  "dac-san": <RiLeafLine />,
  cu: <GiMushroomGills />,
  "gia-vi": <GiHerbsBundle />,
};

function getCatIcon(slug: string) {
  return iconMap[slug] || <RiPlantLine />;
}

export default function Header() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const keyword = params.get("keyword") ?? "";
  const { user, logout } = useAuthStore();
  const fetchWishlist = useWishlistStore((s) => s.fetch);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const wishlistLoaded = useWishlistStore((s) => s.loaded);
  const fetchCart = useCartStore((s) => s.fetch);
  const clearCart = useCartStore((s) => s.clear);
  const cartTotalQty = useCartStore((s) => s.totalQty);

  useEffect(() => {
    if (user) {
      if (!wishlistLoaded) fetchWishlist();
      fetchCart();
    } else {
      clearWishlist();
      clearCart();
    }
  }, [user, wishlistLoaded, fetchWishlist, clearWishlist, fetchCart, clearCart]);

  const { data: categories } = useApi<{ _id: string; name: string; slug: string }[]>("/categories", []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const value = String(fd.get("keyword") || "");
    navigate(`/shop?keyword=${encodeURIComponent(value)}`);
    setMobileOpen(false);
  }

  function closeAll() {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }

  const userDropdown = user ? (
    <div className="user-menu-wrapper" ref={userMenuRef}>
      <button
        type="button"
        className="nav-link user-trigger"
        onClick={() => setUserMenuOpen((v) => !v)}
        aria-label="Tài khoản"
        aria-expanded={userMenuOpen}
      >
        <HiOutlineUserCircle />
        <span className="user-trigger-name">{user.name?.split(" ").pop()}</span>
      </button>
      {userMenuOpen && (
        <>
          <div className="user-menu-backdrop" onClick={() => setUserMenuOpen(false)} />
          <div className="user-menu-dropdown">
            <div className="user-menu-header">
              <strong>{user.name}</strong>
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>{user.email}</span>
            </div>
            <Link to="/account" className="user-menu-item" onClick={closeAll}>
              <HiOutlineUser /> Thông tin cá nhân
            </Link>
            <Link to="/account?tab=orders" className="user-menu-item" onClick={closeAll}>
              <HiOutlineClipboardDocumentList /> Đơn hàng của tôi
            </Link>
            {user.role === "Admin" && (
              <Link to="/admin" className="user-menu-item" onClick={closeAll}>
                <RiShieldCheckLine /> Quản trị
              </Link>
            )}
            <button
              type="button"
              className="user-menu-item user-menu-logout"
              onClick={() => {
                logout();
                navigate("/login");
                closeAll();
              }}
            >
              <HiOutlineArrowRightOnRectangle /> Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  ) : (
    <Link to="/login" className="header-login-link" onClick={closeAll}>
      <HiOutlineUser />
      <span className="header-login-text">Đăng nhập</span>
    </Link>
  );

  const mobileUserBlock = user ? (
    <>
      <Link to="/account" className="nav-link" onClick={closeAll}>
        <HiOutlineUserCircle /> Tài khoản ({user.name?.split(" ").pop()})
      </Link>
      <Link to="/account?tab=orders" className="nav-link" onClick={closeAll}>
        <HiOutlineClipboardDocumentList /> Đơn hàng của tôi
      </Link>
      {user.role === "Admin" && (
        <Link to="/admin" className="nav-link" onClick={closeAll}>
          <RiShieldCheckLine /> Quản trị
        </Link>
      )}
      <button
        type="button"
        className="nav-link"
        onClick={() => {
          logout();
          navigate("/login");
          closeAll();
        }}
      >
        <HiOutlineArrowRightOnRectangle /> Đăng xuất
      </button>
    </>
  ) : (
    <Link to="/login" className="nav-link" onClick={closeAll}>
      <HiOutlineUser /> Đăng nhập
    </Link>
  );

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <Link to="/" className="logo">
              <img
                src="https://res.cloudinary.com/dpigoorhc/image/upload/v1775490823/Logo_ihg1b0.png"
                alt="Logo"
                className="logo-img"
              />
            </Link>
          </div>

          <div className="header-center header-nav-desktop">
            <div className="header-center-nav">
              <div className="nav-dropdown nav-dropdown--centered">
                <Link to="/shop" className="nav-link nav-link--plain nav-dropdown-trigger" onClick={closeAll}>
                  Sản phẩm
                </Link>
                <div className="nav-dropdown-panel" role="menu">
                  <Link to="/shop" className="nav-dropdown-item" onClick={closeAll} role="menuitem">
                    <RiApps2Line /> Tất cả sản phẩm
                  </Link>
                  {(categories || []).map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/shop?categoryId=${cat._id}`}
                      className="nav-dropdown-item"
                      onClick={closeAll}
                      role="menuitem"
                    >
                      {getCatIcon(cat.slug)} {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/contact" className="nav-link nav-link--plain" onClick={closeAll}>
                Liên hệ
              </Link>
              <Link to="/wishlist" className="nav-link nav-link--plain" onClick={closeAll}>
                Yêu thích
              </Link>
            </div>
          </div>

          <div className="header-right">
            <form onSubmit={handleSearch} className="search-bar search-bar--header">
              <input
                aria-label="Tìm kiếm sản phẩm"
                name="keyword"
                defaultValue={keyword}
                placeholder="Tìm nông sản..."
              />
              <button type="submit" aria-label="Tìm kiếm">
                <HiOutlineMagnifyingGlass />
              </button>
            </form>

            <span className="header-cart-wrap">
              <Link
                to="/cart"
                className="header-icon-btn"
                title="Giỏ hàng"
                aria-label={
                  user && cartTotalQty > 0
                    ? `Giỏ hàng, ${cartTotalQty} sản phẩm`
                    : "Giỏ hàng"
                }
                onClick={closeAll}
              >
                <HiOutlineShoppingCart />
              </Link>
              {user && cartTotalQty > 0 && (
                <span className="cart-badge" aria-hidden>
                  {cartTotalQty > 99 ? "99+" : cartTotalQty}
                </span>
              )}
            </span>

            {user && <NotificationBell />}

            {userDropdown}

            <button
              type="button"
              className="mobile-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <HiOutlineBars3 />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-nav ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-nav-close">
            <button type="button" className="btn-ghost" onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
              <HiOutlineXMark style={{ fontSize: "1.5rem" }} />
            </button>
          </div>

          <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="keyword"
                defaultValue={keyword}
                placeholder="Tìm nông sản..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-sm">
                <HiOutlineMagnifyingGlass />
              </button>
            </div>
          </form>

          <p className="mobile-nav-section-title">Danh mục</p>
          <Link to="/shop" className="nav-link" onClick={closeAll}>
            <RiApps2Line /> Tất cả sản phẩm
          </Link>
          {(categories || []).map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?categoryId=${cat._id}`}
              className="nav-link"
              onClick={closeAll}
            >
              {getCatIcon(cat.slug)} {cat.name}
            </Link>
          ))}

          <div style={{ borderTop: "1px solid var(--c-border)", margin: "12px 0" }} />
          <Link to="/contact" className="nav-link" onClick={closeAll}>
            <HiOutlineChatBubbleLeftRight /> Liên hệ
          </Link>
          <Link to="/wishlist" className="nav-link" onClick={closeAll}>
            Yêu thích
          </Link>
          <Link to="/cart" className="nav-link" onClick={closeAll}>
            <HiOutlineShoppingCart />
            {user && cartTotalQty > 0
              ? `Giỏ hàng (${cartTotalQty > 99 ? "99+" : cartTotalQty})`
              : "Giỏ hàng"}
          </Link>

          <div style={{ borderTop: "1px solid var(--c-border)", margin: "12px 0" }} />
          {mobileUserBlock}
        </div>
      </div>
    </>
  );
}
