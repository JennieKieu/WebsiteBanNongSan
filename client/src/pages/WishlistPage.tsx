import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiOutlineBuildingOffice2,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { RiLeafLine } from "react-icons/ri";
import http from "../api/http";
import { useApi } from "../hooks/useApi";
import { useWishlistStore } from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";

const PLACEHOLDER_IMG =
  "https://placehold.co/600x400/E8F5E9/2E7D32?text=Natural+Store";

type WishProduct = {
  _id: string;
  name: string;
  supplier?: string;
  certifications?: string[];
  unit: string;
  price: number;
  salePrice?: number | null;
  availableStock?: number;
  isActive?: boolean;
  images?: { secure_url: string }[];
};

export default function WishlistPage() {
  const { data, loading, setData } = useApi<any>("/wishlist", []);
  const removeFromStore = useWishlistStore((s) => s.remove);
  const [addingId, setAddingId] = useState<string | null>(null);

  const products: WishProduct[] = (data?.productIds || []).filter(
    (p: any) => p && p._id,
  );

  useEffect(() => {
    useWishlistStore.getState().fetch();
  }, []);

  async function handleRemove(productId: string) {
    await removeFromStore(productId);
    setData((prev: any) => ({
      ...prev,
      productIds: (prev?.productIds || []).filter(
        (p: any) => p._id !== productId,
      ),
    }));
  }

  async function handleAddToCart(productId: string) {
    setAddingId(productId);
    try {
      await http.post("/cart/items", { productId, quantity: 1 });
      await useCartStore.getState().fetch();
    } catch {
      alert("Vui lòng đăng nhập hoặc kiểm tra lại sản phẩm.");
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-head wishlist-head--skeleton">
          <div className="cart-skeleton cart-skeleton--title" />
        </div>
        <div className="wishlist-grid">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="wishlist-card wishlist-card--skeleton">
              <div className="cart-skeleton" style={{ width: "100%", height: 180, borderRadius: "var(--radius) var(--radius) 0 0" }} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="cart-skeleton cart-skeleton--text-lg" />
                <div className="cart-skeleton cart-skeleton--text-sm" />
                <div className="cart-skeleton cart-skeleton--qty" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="wishlist-page wishlist-page--empty">
        <div className="wishlist-empty-hero">
          <div className="wishlist-empty-hero__icon" aria-hidden>
            <HiOutlineHeart />
          </div>
          <h1 className="wishlist-empty-hero__title">
            Danh sách yêu thích đang trống
          </h1>
          <p className="wishlist-empty-hero__text">
            Khám phá cửa hàng và nhấn vào biểu tượng trái tim để lưu sản phẩm
            bạn thích.
          </p>
          <div className="wishlist-empty-hero__actions">
            <Link to="/shop" className="btn">
              <HiOutlineShoppingBag /> Khám phá cửa hàng
            </Link>
            <Link to="/" className="btn btn-outline">
              <HiOutlineArrowLeft /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <header className="wishlist-head">
        <div className="wishlist-head__row">
          <h1 className="wishlist-head__title">
            <HiHeart className="wishlist-head__icon" aria-hidden />
            Sản phẩm yêu thích
            <span className="cart-page-badge">{products.length}</span>
          </h1>
          <Link to="/shop" className="cart-continue-link">
            <HiOutlineArrowLeft /> Tiếp tục mua
          </Link>
        </div>
      </header>

      <div className="wishlist-grid">
        {products.map((p) => {
          const hasSale =
            p.salePrice != null && p.salePrice < p.price;
          const displayPrice = hasSale ? p.salePrice! : p.price;
          const inStock =
            (p.isActive !== false) && Number(p.availableStock ?? 0) > 0;
          const isAdding = addingId === p._id;

          return (
            <article key={p._id} className="card wishlist-card">
              <button
                type="button"
                className="wishlist-heart wishlist-heart--active wishlist-card-remove"
                onClick={() => handleRemove(p._id)}
                aria-label="Bỏ yêu thích"
                title="Bỏ yêu thích"
              >
                <HiHeart />
              </button>

              <Link to={`/products/${p._id}`}>
                <img
                  src={p.images?.[0]?.secure_url || PLACEHOLDER_IMG}
                  alt={p.name}
                  className="product-thumb"
                  loading="lazy"
                />
              </Link>

              <div className="card-body">
                <div className="product-tags">
                  {(p.certifications || []).slice(0, 2).map((c) => (
                    <span className="tag" key={c}>
                      <RiLeafLine style={{ fontSize: 10, verticalAlign: "middle" }} /> {c}
                    </span>
                  ))}
                </div>

                <Link to={`/products/${p._id}`} className="product-name">
                  {p.name}
                </Link>

                <div className="product-origin">
                  <HiOutlineBuildingOffice2 /> {p.supplier || "—"}
                </div>

                <div className="product-price-row">
                  <span className="product-price">
                    {displayPrice.toLocaleString("vi-VN")}₫
                  </span>
                  {hasSale && (
                    <span className="product-price-old">
                      {p.price.toLocaleString("vi-VN")}₫
                    </span>
                  )}
                  <span className="product-unit">/ {p.unit}</span>
                </div>

                <div className="product-stock">
                  {inStock ? (
                    <span className="badge badge-green">Còn hàng</span>
                  ) : (
                    <span className="badge badge-red">Hết hàng</span>
                  )}
                </div>

                <div className="wishlist-card-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ flex: 1 }}
                    disabled={!inStock || isAdding}
                    onClick={() => handleAddToCart(p._id)}
                  >
                    <HiOutlineShoppingCart />
                    {isAdding ? "Đang thêm..." : "Thêm vào giỏ"}
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-sm"
                    onClick={() => handleRemove(p._id)}
                    aria-label="Xóa khỏi yêu thích"
                    title="Xóa khỏi yêu thích"
                    style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
