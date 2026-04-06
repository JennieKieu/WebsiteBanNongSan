import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  Apple,
  ChevronDown,
  Coffee,
  Cookie,
  Home,
  Leaf,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Sprout,
  User,
} from '../icons'
import { Container } from '../ui/Container'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobileNav = useMediaQuery('(max-width: 899px)')
  const [menuOpen, setMenuOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  /** Desktop: sau khi chọn link submenu, ẩn menu cấp 2 cho đến khi chuột rời khỏi mục Sản phẩm (tránh :hover giữ menu mở). */
  const [subnavSuppressed, setSubnavSuppressed] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const isFirstLocationSync = useRef(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isMobileNav || !menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProductsOpen(false)
        setAccountOpen(false)
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isMobileNav, menuOpen])

  /* Đóng menu khi đổi route — gồm cả query (?category=…). Lần mount đầu không bật subnavSuppressed (tránh chặn hover desktop). */
  useEffect(() => {
    setMenuOpen(false)
    setProductsOpen(false)
    setAccountOpen(false)
    if (isFirstLocationSync.current) {
      isFirstLocationSync.current = false
    } else {
      setSubnavSuppressed(true)
    }
  }, [location.pathname, location.search, location.key])

  const closeMenu = () => setMenuOpen(false)
  const closeAllMenus = () => {
    setProductsOpen(false)
    setAccountOpen(false)
    closeMenu()
    setSubnavSuppressed(true)
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const s = q.trim()
    navigate(s ? `/products?search=${encodeURIComponent(s)}` : '/products')
    closeAllMenus()
  }

  const isActive = (path: string) => location.pathname === path

  const userInitial = (user?.name?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? '?').toUpperCase()
  const displayName = user?.name?.trim() || user?.email || 'Tài khoản'

  const authInNav = (
    <div className="ns-header__auth ns-header__auth--in-nav">
      {user ? (
        <>
          <div className={`ns-header__user-block ${accountOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="ns-header__user-trigger ns-header__user-trigger--nav"
              aria-expanded={accountOpen}
              aria-haspopup="true"
              onClick={() => setAccountOpen((v) => !v)}
            >
              <span className="ns-header__user-avatar ns-header__user-avatar--nav">{userInitial}</span>
              <span className="ns-header__user-trigger-main">
                <span className="ns-header__user-name">{displayName}</span>
                <span className="ns-header__user-role">{user.role === 'Admin' ? 'Quản trị viên' : 'Khách hàng'}</span>
              </span>
              <ChevronDown className="ns-header__user-chevron" size={20} strokeWidth={2} aria-hidden />
            </button>
            <div className="ns-header__user-panel" role="menu">
              <Link
                to="/profile"
                className="ns-header__user-panel-link"
                role="menuitem"
                onClick={closeAllMenus}
              >
                <User className="ns-header__user-panel-icon" size={18} strokeWidth={2} aria-hidden />
                Thông tin cá nhân
              </Link>
              <button
                type="button"
                className="ns-header__user-panel-btn"
                role="menuitem"
                onClick={() => {
                  logout()
                  closeAllMenus()
                }}
              >
                <LogOut className="ns-header__user-panel-icon" size={18} strokeWidth={2} aria-hidden />
                Đăng xuất
              </button>
            </div>
          </div>
          <Link to="/cart" className="ns-header__link ns-header__link--with-icon" onClick={closeAllMenus}>
            <ShoppingCart className="ns-header__link-icon" size={18} strokeWidth={2} aria-hidden />
            Giỏ hàng
          </Link>
          {user.role === 'Admin' && (
            <Link to="/admin" className="ns-header__link ns-header__link--with-icon ns-header__link--accent" onClick={closeAllMenus}>
              <Settings className="ns-header__link-icon" size={18} strokeWidth={2} aria-hidden />
              Admin
            </Link>
          )}
        </>
      ) : (
        <>
          <Link to="/login" className="ns-header__link ns-header__link--accent" onClick={closeAllMenus}>
            Đăng nhập
          </Link>
          <Link to="/register" className="ns-header__link ns-header__link--accent" onClick={closeAllMenus}>
            Đăng ký
          </Link>
        </>
      )}
    </div>
  )

  const authInActions = (
    <div className="ns-header__auth ns-header__auth--in-actions">
      {user ? (
        <>
          <div className="ns-header__user-menu">
            <button type="button" className="ns-header__user-trigger ns-header__user-trigger--desktop" aria-haspopup="menu">
              <span className="ns-header__user-avatar ns-header__user-avatar--sm">{userInitial}</span>
              <span className="ns-header__user-label">{displayName}</span>
              <ChevronDown className="ns-header__user-chevron ns-header__user-chevron--desktop" size={16} strokeWidth={2} aria-hidden />
            </button>
            <div className="ns-header__user-dropdown" role="menu">
              <Link to="/profile" className="ns-header__user-dropdown-link" role="menuitem">
                <User size={18} strokeWidth={2} aria-hidden />
                Thông tin cá nhân
              </Link>
              <button type="button" className="ns-header__user-dropdown-btn" role="menuitem" onClick={() => logout()}>
                <LogOut size={18} strokeWidth={2} aria-hidden />
                Đăng xuất
              </button>
            </div>
          </div>
          <Link to="/cart" className="ns-header__link ns-header__toolbar-icon" title="Giỏ hàng" aria-label="Giỏ hàng">
            <ShoppingCart size={22} strokeWidth={2} aria-hidden />
          </Link>
          {user.role === 'Admin' && (
            <Link to="/admin" className="ns-header__link ns-header__link--accent ns-header__toolbar-icon" title="Admin" aria-label="Admin">
              <Settings size={22} strokeWidth={2} aria-hidden />
            </Link>
          )}
        </>
      ) : (
        <>
          <Link to="/login" className="ns-header__link ns-header__link--accent">
            Đăng nhập
          </Link>
          <Link to="/register" className="ns-header__link ns-header__link--accent">
            Đăng ký
          </Link>
        </>
      )}
    </div>
  )

  return (
    <header className={`ns-header ${scrolled ? 'is-scrolled' : ''}`}>
      <Container>
        <div className="ns-header__inner">
          <Link to="/" className="ns-header__brand" onClick={closeAllMenus} aria-label="Về trang chủ">
            <img src="/Logo.png" alt="Natural Store" className="ns-header__logo" width={70} height={70} />
          </Link>

          <nav
            className={`ns-header__nav ${menuOpen ? 'is-open' : ''}`}
            id="main-nav"
            aria-label="Điều hướng chính"
          >
            <form className="ns-header__search-form ns-header__search-form--mobile" onSubmit={onSearch} role="search">
              <input
                className="ns-input"
                name="q"
                type="search"
                placeholder="Tìm sản phẩm..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Tìm sản phẩm"
              />
            </form>
            <div className="ns-header__menu">
              <Link
                to="/"
                className={`ns-header__link ${isActive('/') ? 'is-active' : ''}`}
                onClick={closeAllMenus}
              >
                <Home className="ns-header__link-icon" size={18} strokeWidth={2} aria-hidden />
                Trang chủ
              </Link>
              <div
                className={`ns-header__item ns-header__item--has-sub ${productsOpen ? 'is-open' : ''} ${subnavSuppressed ? 'ns-subnav-suppressed' : ''}`}
                onMouseLeave={() => setSubnavSuppressed(false)}
                onFocusCapture={() => setSubnavSuppressed(false)}
              >
                <button
                  type="button"
                  className={`ns-header__link ns-header__trigger ${location.pathname.startsWith('/products') ? 'is-active' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={isMobileNav ? productsOpen : undefined}
                  onClick={() => {
                    if (isMobileNav) setProductsOpen((v) => !v)
                    else setSubnavSuppressed(false)
                  }}
                >
                  <Sprout className="ns-header__link-icon" size={18} strokeWidth={2} aria-hidden />
                  Sản phẩm
                </button>
                <div className="ns-header__submenu">
                  <Link to="/products" className="ns-header__sublink" onClick={closeAllMenus}>
                    <Package className="ns-header__sublink-icon" size={18} strokeWidth={2} aria-hidden />
                    Tất cả sản phẩm
                  </Link>
                  <Link to="/products?category=trai-cay-say-mut" className="ns-header__sublink" onClick={closeAllMenus}>
                    <Apple className="ns-header__sublink-icon" size={18} strokeWidth={2} aria-hidden />
                    Trái cây sấy, mứt
                  </Link>
                  <Link to="/products?category=banh-mut-do-kho" className="ns-header__sublink" onClick={closeAllMenus}>
                    <Cookie className="ns-header__sublink-icon" size={18} strokeWidth={2} aria-hidden />
                    Bánh mứt, đồ khô
                  </Link>
                  <Link to="/products?category=tra-ca-phe" className="ns-header__sublink" onClick={closeAllMenus}>
                    <Coffee className="ns-header__sublink-icon" size={18} strokeWidth={2} aria-hidden />
                    Trà, cà phê
                  </Link>
                  <Link to="/products?category=nong-san-duoc-lieu" className="ns-header__sublink" onClick={closeAllMenus}>
                    <Leaf className="ns-header__sublink-icon" size={18} strokeWidth={2} aria-hidden />
                    Nông sản, dược liệu
                  </Link>
                </div>
              </div>
            </div>
            {authInNav}
          </nav>

          <div className="ns-header__actions">
            <form className="ns-header__search-form ns-header__search-form--desktop" onSubmit={onSearch} role="search">
              <input
                className="ns-input"
                name="q"
                type="search"
                placeholder="Tìm sản phẩm..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Tìm sản phẩm"
              />
            </form>
            {authInActions}
          </div>

          <div className="ns-header__mobile-tools">
            {user ? (
              <Link to="/cart" className="ns-header__link ns-header__toolbar-icon" onClick={closeAllMenus} aria-label="Giỏ hàng" title="Giỏ hàng">
                <ShoppingCart size={22} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
            <button
              type="button"
              className={`ns-header__toggle ${menuOpen ? 'is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              aria-label={menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              onClick={() => {
                setMenuOpen((v) => !v)
                setProductsOpen(false)
                setAccountOpen(false)
              }}
            >
              <span className="ns-header__hamburger" aria-hidden>
                <span className="ns-header__hamburger-line" />
                <span className="ns-header__hamburger-line" />
                <span className="ns-header__hamburger-line" />
              </span>
            </button>
          </div>
        </div>
      </Container>

      {menuOpen && isMobileNav ? (
        <div
          className="ns-header__backdrop"
          onClick={closeAllMenus}
          role="presentation"
          aria-hidden
        />
      ) : null}
    </header>
  )
}
