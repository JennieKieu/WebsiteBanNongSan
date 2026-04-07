import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminResourcePage from "./pages/AdminResourcePage";
import AdminBannerPage from "./pages/AdminBannerPage";
import AdminCategoryPage from "./pages/AdminCategoryPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminProductDetailPage from "./pages/AdminProductDetailPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import WishlistPage from "./pages/WishlistPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuthStore } from "./store/useAuthStore";

function RequireAuth() {
  const { user } = useAuthStore();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireAdmin() {
  const { user } = useAuthStore();
  return user?.role === "Admin" ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="auth-page" style={{ justifyContent: "center", minHeight: "50vh" }}>
        <p className="text-muted">Đang tải phiên đăng nhập…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route element={<RequireAuth />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="banners" element={<AdminBannerPage />} />
          <Route path="categories" element={<AdminCategoryPage />} />
          <Route path="products/:id" element={<AdminProductDetailPage />} />
          <Route path="products" element={<AdminResourcePage />} />
          <Route path="batches" element={<AdminResourcePage />} />
          <Route path="orders" element={<AdminResourcePage />} />
          <Route path="customers" element={<AdminResourcePage />} />
          <Route path="coupons" element={<AdminResourcePage />} />
          <Route path="contacts" element={<AdminResourcePage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
