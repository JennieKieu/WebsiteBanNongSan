import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  HiOutlineShoppingCart,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineCheckBadge,
  HiOutlineHeart,
  HiHeart,
} from "react-icons/hi2";

import http from "../api/http";
import { useApi } from "../hooks/useApi";
import { useAuthStore } from "../store/useAuthStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";
import ProductCard from "../components/ProductCard";
import VnIntegerInput from "../components/VnIntegerInput";
import { formatDateVN } from "../utils/vnDatetime";

export default function ProductDetailPage() {
  const { id = "" } = useParams();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cartQty, setCartQty] = useState(0);
  const { data, loading } = useApi<any>(`/products/${id}`, [id]);
  const product = data || {};
  const relatedProducts: any[] = Array.isArray(product.relatedProducts) ? product.relatedProducts : [];
  const gallery: { secure_url: string }[] = Array.isArray(product.images) ? product.images : [];
  const [activeImg, setActiveImg] = useState(0);

  const user = useAuthStore((s) => s.user);
  const liked = useWishlistStore((s) => s.ids.has(id));
  const toggleWish = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    setActiveImg(0);
    setQty(1);
    setCartQty(0);
  }, [id]);

  /* Lấy số lượng sản phẩm này đang có trong giỏ (chỉ khi đã đăng nhập). */
  useEffect(() => {
    if (!user || !id) return;
    http.get("/cart").then((res) => {
      const items: { productId: string; quantity: number }[] = res.data.data?.items || [];
      const found = items.find((it) => it.productId === id || String(it.productId) === id);
      setCartQty(found ? Number(found.quantity) : 0);
    }).catch(() => {});
  }, [user, id]);

  async function addToCart() {
    setAdding(true);
    try {
      const newQty = cartQty + qty;
      await http.post("/cart/items", { productId: id, quantity: newQty });
      setCartQty(newQty);
      setQty(1);
      await useCartStore.getState().fetch();
    } catch {
      alert("Vui lòng đăng nhập để thêm giỏ hàng");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="loading-spinner">Đang tải chi tiết sản phẩm...</div>;

  const hasSale = product.salePrice && product.salePrice < product.price;
  const inStock = Number(product.availableStock ?? 0) > 0;
  const canAdd = inStock ? Math.max(0, Math.min(99, Number(product.availableStock) - cartQty)) : 0;
  const maxQty = canAdd;
  const safeIdx = gallery.length ? Math.min(activeImg, gallery.length - 1) : 0;
  const mainSrc =
    gallery[safeIdx]?.secure_url ||
    "https://placehold.co/600x600/E8F5E9/2E7D32?text=Natural+Store";

  return (
    <div className="stack-lg">
      <div className="detail-grid">
        <div className="detail-gallery">
          <img src={mainSrc} alt={product.name} className="detail-gallery-main" />
          {gallery.length > 1 && (
            <div className="detail-gallery-thumbs" role="tablist" aria-label="Ảnh sản phẩm">
              {gallery.map((im, idx) => (
                <button
                  key={`${im.secure_url}-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={safeIdx === idx}
                  className={`detail-gallery-thumb ${safeIdx === idx ? "active" : ""}`}
                  onClick={() => setActiveImg(idx)}
                >
                  <img src={im.secure_url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1>{product.name}</h1>

          <div className="detail-meta">
            <div className="detail-meta-item">
              <HiOutlineBuildingOffice2 /> {product.supplier || "—"}
            </div>
          </div>

          {(product.certifications || []).length > 0 && (
            <div className="row" style={{ gap: 6 }}>
              {product.certifications.map((c: string) => (
                <span key={c} className="badge badge-green">
                  <HiOutlineCheckBadge /> {c}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
            <span className="detail-price">
              {(hasSale ? product.salePrice : product.price || 0).toLocaleString("vi-VN")}₫
            </span>
            {hasSale && (
              <span className="detail-price-old">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
            )}
            <span className="text-muted">/ {product.unit}</span>
          </div>

          <p className="text-muted">
            Tồn kho: <strong className={product.availableStock > 0 ? "text-success" : "text-error"}>
              {product.availableStock ?? 0} {product.unit}
            </strong>
          </p>

          {product.description && <p>{product.description}</p>}

          <div className="detail-actions">
            {!inStock ? (
              <div className="detail-out-of-stock">
                <span className="badge badge-red" style={{ fontSize: "1rem", padding: "8px 18px" }}>Hết hàng</span>
                <p className="text-muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                  Sản phẩm tạm thời hết hàng. Vui lòng quay lại sau.
                </p>
              </div>
            ) : canAdd === 0 ? (
              <div className="detail-out-of-stock">
                <span className="badge badge-orange" style={{ fontSize: "1rem", padding: "8px 18px" }}>Đã thêm tối đa</span>
                <p className="text-muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                  Bạn đã thêm toàn bộ số lượng còn lại ({cartQty} {product.unit}) vào giỏ hàng.
                </p>
              </div>
            ) : (
              <>
                <div className="qty-control">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                  <VnIntegerInput
                    min={1}
                    max={maxQty}
                    value={qty}
                    onValueChange={(n) => {
                      if (n === null) setQty(1);
                      else setQty(Math.max(1, Math.min(maxQty, n)));
                    }}
                    aria-label="Số lượng"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                  >
                    +
                  </button>
                </div>
                <button className="btn" onClick={addToCart} disabled={adding}>
                  <HiOutlineShoppingCart />
                  {adding ? "Đang thêm..." : "Thêm vào giỏ"}
                </button>
              </>
            )}
            {user && (
              <button
                type="button"
                className={`btn-wishlist-detail ${liked ? "btn-wishlist-detail--active" : ""}`}
                onClick={() => toggleWish(id)}
                aria-label={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}
                title={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}
              >
                {liked ? <HiHeart /> : <HiOutlineHeart />}
                {liked ? "Đã thích" : "Yêu thích"}
              </button>
            )}
          </div>

          {/* Thông tin lô hàng */}
          {(product.batches || []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <HiOutlineCalendarDays /> Thông tin lô hàng
              </h3>
              <div className="batch-list" style={{ marginTop: 8 }}>
                {(product.batches || []).map((b: any) => (
                  <div className="batch-item" key={b._id}>
                    <span className="badge badge-blue">{b.batchCode}</span>
                    <span>HSD: {formatDateVN(b.expiryDate)}</span>
                    <span className={
                      b.status === "Active" ? "badge badge-green" :
                      b.status === "NearExpiry" ? "badge badge-orange" :
                      "badge badge-red"
                    }>
                      {b.status === "Active" ? "Còn hạn" : b.status === "NearExpiry" ? "Sắp hết hạn" : b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="related-products-title">Có thể bạn sẽ thích</h2>
          <div className="products-grid">
            {relatedProducts.map((rp: any) => (
              <ProductCard key={rp._id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
