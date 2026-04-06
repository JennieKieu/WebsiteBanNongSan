import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiOutlineShoppingBag,
  HiOutlineArrowLeft,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineBuildingOffice2,
  HiOutlineTicket,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import http from "../api/http";
import { useApi } from "../hooks/useApi";
import { useCartStore } from "../store/useCartStore";
import VnIntegerInput from "../components/VnIntegerInput";
import { formatDateVN } from "../utils/vnDatetime";

const PLACEHOLDER_IMG =
  "https://placehold.co/600x400/E8F5E9/2E7D32?text=Natural+Store";
const FREE_SHIP_THRESHOLD = 300_000;
const DEFAULT_SHIPPING = 20_000;

type CartProduct = {
  _id: string;
  name: string;
  supplier?: string;
  unit: string;
  price: number;
  salePrice?: number | null;
  images?: { secure_url: string }[];
};

type CartItem = {
  productId: string;
  quantity: number;
  product: CartProduct;
  availableStock?: number;
};

type CartData = { items: CartItem[] };

type PublicCoupon = {
  _id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  endAt: string;
};

function lineUnitPrice(p: CartProduct) {
  return p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
}

export default function CartPage() {
  const { data, loading, setData } = useApi<CartData>("/cart", []);
  const { data: couponsData } = useApi<PublicCoupon[]>("/coupons/active", []);
  const coupons = couponsData || [];
  const items = data?.items ?? [];

  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (loading) return;
    const list = data?.items ?? [];
    const t = list.reduce((s, i) => s + Number(i.quantity), 0);
    useCartStore.getState().setTotalQty(t);
  }, [loading, data]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + lineUnitPrice(i.product) * i.quantity,
        0,
      ),
    [items],
  );

  const appliedCouponObj = coupons.find((c) => c.code === appliedCoupon) || null;
  const discount = useMemo(() => {
    if (!appliedCouponObj) return 0;
    if (subtotal < appliedCouponObj.minOrderValue) return 0;
    const raw =
      appliedCouponObj.discountType === "PERCENT"
        ? (subtotal * appliedCouponObj.discountValue) / 100
        : appliedCouponObj.discountValue;
    return Math.min(raw, subtotal);
  }, [appliedCouponObj, subtotal]);

  function applyCoupon(code: string) {
    setCouponError("");
    const coupon = coupons.find((c) => c.code === code.toUpperCase());
    if (!coupon) {
      setCouponError("Mã giảm giá không hợp lệ");
      return;
    }
    if (subtotal < coupon.minOrderValue) {
      setCouponError(`Đơn tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}₫`);
      return;
    }
    setAppliedCoupon(coupon.code);
    setCouponInput("");
  }

  function removeCoupon() {
    setAppliedCoupon("");
    setCouponError("");
  }

  const shippingFee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : DEFAULT_SHIPPING;
  const grandTotal = subtotal - discount + shippingFee;
  const shipProgressPct = Math.min(
    100,
    Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100),
  );
  const amountToFreeShip = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);

  async function changeQuantity(
    productId: string,
    rawQty: number,
    maxStock: number,
  ) {
    const maxAllowed = Math.min(99, maxStock);
    const quantity = Math.max(1, Math.min(maxAllowed, Math.floor(rawQty)));
    await http.post("/cart/items", { productId, quantity });
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.productId === productId ? { ...it, quantity } : it,
        ),
      };
    });
  }

  async function removeItem(productId: string) {
    await http.delete(`/cart/items/${productId}`);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((it) => it.productId !== productId),
      };
    });
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-page-head cart-page-head--skeleton">
          <div className="cart-skeleton cart-skeleton--title" />
          <div className="cart-skeleton cart-skeleton--line" />
        </div>
        <div className="cart-layout">
          <div className="cart-list cart-list--skeleton">
            {[1, 2, 3].map((k) => (
              <div key={k} className="cart-row cart-row--skeleton">
                <div className="cart-skeleton cart-skeleton--thumb" />
                <div className="cart-skeleton-block">
                  <div className="cart-skeleton cart-skeleton--text-lg" />
                  <div className="cart-skeleton cart-skeleton--text-sm" />
                  <div className="cart-skeleton cart-skeleton--qty" />
                </div>
                <div className="cart-skeleton cart-skeleton--price" />
              </div>
            ))}
          </div>
          <div className="cart-summary-card cart-summary-card--skeleton">
            <div className="cart-skeleton cart-skeleton--line" />
            <div className="cart-skeleton cart-skeleton--line" />
            <div className="cart-skeleton cart-skeleton--btn" />
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="cart-page cart-page--empty">
        <div className="cart-empty-hero">
          <div className="cart-empty-hero__icon" aria-hidden>
            <HiOutlineShoppingCart />
          </div>
          <h1 className="cart-empty-hero__title">Giỏ hàng đang trống</h1>
          <p className="cart-empty-hero__text">
            Thêm nông sản sạch vào giỏ để xem tổng tiền và tiến hành đặt hàng.
          </p>
          <div className="cart-empty-hero__actions">
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
    <div className="cart-page">
      <header className="cart-page-head">
        <nav className="cart-breadcrumb" aria-label="Điều hướng">
          <Link to="/shop">Cửa hàng</Link>
          <span className="cart-breadcrumb__sep">/</span>
          <span className="cart-breadcrumb__current">Giỏ hàng</span>
        </nav>
        <div className="cart-page-head__row">
          <h1 className="cart-page-title">
            <HiOutlineShoppingCart className="cart-page-title__icon" aria-hidden />
            Giỏ hàng
            <span className="cart-page-badge">{items.length}</span>
          </h1>
          <Link to="/shop" className="cart-continue-link">
            <HiOutlineArrowLeft /> Tiếp tục mua
          </Link>
        </div>
      </header>

      <div className="cart-ship-banner">
        <div className="cart-ship-banner__head">
          <HiOutlineTruck className="cart-ship-banner__icon" aria-hidden />
          <span>
            {subtotal >= FREE_SHIP_THRESHOLD
              ? "Đơn hàng của bạn được miễn phí giao hàng"
              : `Mua thêm ${amountToFreeShip.toLocaleString("vi-VN")}₫ để miễn phí ship`}
          </span>
        </div>
        <div
          className="cart-ship-banner__track"
          role="progressbar"
          aria-valuenow={shipProgressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ đạt mức miễn phí vận chuyển"
        >
          <div
            className="cart-ship-banner__fill"
            style={{ width: `${shipProgressPct}%` }}
          />
        </div>
        <p className="cart-ship-banner__hint">
          Miễn phí ship cho đơn từ {FREE_SHIP_THRESHOLD.toLocaleString("vi-VN")}₫
        </p>
      </div>

      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => {
            const p = item.product;
            const id = p?._id || item.productId;
            const unit = lineUnitPrice(p);
            const hasSale =
              p.salePrice != null && p.salePrice < p.price;
            const lineTotal = unit * item.quantity;
            const maxStock = Math.min(99, Number(item.availableStock ?? 99));

            return (
              <li key={item.productId} className="cart-row">
                <Link
                  to={`/products/${id}`}
                  className="cart-row-thumb"
                  title={p?.name}
                >
                  <img
                    src={p?.images?.[0]?.secure_url || PLACEHOLDER_IMG}
                    alt=""
                    loading="lazy"
                  />
                </Link>

                <div className="cart-row-body">
                  <div className="cart-row-top">
                    <Link to={`/products/${id}`} className="cart-row-title">
                      {p?.name || "Sản phẩm"}
                    </Link>
                    <button
                      type="button"
                      className="cart-row-remove"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Xóa ${p?.name || "sản phẩm"} khỏi giỏ`}
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>

                  <div className="cart-row-meta">
                    <span className="cart-row-origin">
                      <HiOutlineBuildingOffice2 aria-hidden />
                      {p?.supplier || "—"}
                    </span>
                    <span className="cart-row-dot">·</span>
                    <span>{p?.unit || "—"}</span>
                  </div>

                  <div className="cart-row-pricing">
                    <div className="cart-row-unit-prices">
                      {hasSale && (
                        <span className="cart-price-old">
                          {p.price.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                      <span className="cart-price-unit">
                        {unit.toLocaleString("vi-VN")}₫
                      </span>
                      <span className="cart-price-per">/ {p?.unit}</span>
                    </div>

                    <div className="qty-control cart-qty-control">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.productId,
                            item.quantity - 1,
                            maxStock,
                          )
                        }
                        disabled={item.quantity <= 1}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <VnIntegerInput
                        commitOnBlur
                        min={1}
                        max={maxStock}
                        value={item.quantity}
                        onCommit={(n) =>
                          changeQuantity(item.productId, n, maxStock)
                        }
                        aria-label="Số lượng"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.productId,
                            item.quantity + 1,
                            maxStock,
                          )
                        }
                        disabled={item.quantity >= maxStock}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {item.availableStock != null && item.availableStock <= 10 && (
                    <p className="cart-row-stock-note">
                      Còn {item.availableStock} sản phẩm trong kho
                    </p>
                  )}
                </div>

                <div className="cart-row-total">
                  <span className="cart-row-total__label">Thành tiền</span>
                  <span className="cart-row-total__value">
                    {lineTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="cart-summary-card" aria-labelledby="cart-summary-heading">
          <h2 id="cart-summary-heading" className="cart-summary-card__title">
            Tóm tắt đơn hàng
          </h2>

          {/* Coupon section */}
          <div className="cart-coupon-section">
            <div className="cart-coupon-header">
              <span className="cart-coupon-header__label">
                <HiOutlineTicket /> Mã giảm giá
              </span>
              {coupons.length > 0 && (
                <span className="cart-coupon-header__count">{coupons.length} mã đang hoạt động</span>
              )}
            </div>
            <p className="cart-coupon-intro">
              {coupons.length > 0
                ? "Chọn mã trong danh sách bên dưới hoặc nhập mã vào ô."
                : "Nhập mã giảm giá (nếu có) vào ô bên dưới."}
            </p>

            {appliedCoupon && (
              <div className="cart-coupon-applied">
                <span>
                  <HiOutlineCheckCircle className="text-success" />
                  <strong>{appliedCoupon}</strong>
                  <span className="text-success" style={{ fontSize: "0.8125rem" }}>
                    {" "}−{discount.toLocaleString("vi-VN")}₫
                  </span>
                </span>
                <button type="button" className="cart-coupon-remove" onClick={removeCoupon} title="Bỏ mã">
                  <HiOutlineXMark />
                </button>
              </div>
            )}

            {!appliedCoupon && (
              <div className="cart-coupon-input-row">
                <input
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                  placeholder="Nhập mã giảm giá"
                  className="cart-coupon-input"
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={!couponInput.trim()}
                  onClick={() => applyCoupon(couponInput.trim())}
                >
                  Áp dụng
                </button>
              </div>
            )}
            {couponError && <p className="cart-coupon-error">{couponError}</p>}

            {coupons.length > 0 && (
              <div className="cart-coupon-list">
                {coupons.map((c) => {
                  const isApplied = appliedCoupon === c.code;
                  const meetsMin = subtotal >= c.minOrderValue;
                  return (
                    <div key={c._id} className={`cart-coupon-item ${isApplied ? "cart-coupon-item--active" : ""} ${!meetsMin ? "cart-coupon-item--disabled" : ""}`}>
                      <div className="cart-coupon-item__info">
                        <span className="cart-coupon-item__code">{c.code}</span>
                        <span className="cart-coupon-item__desc">
                          Giảm {c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString("vi-VN")}₫`}
                          {c.minOrderValue > 0 && ` · Đơn từ ${c.minOrderValue.toLocaleString("vi-VN")}₫`}
                        </span>
                        <span className="cart-coupon-item__exp">
                          HSD: {formatDateVN(c.endAt)}
                        </span>
                      </div>
                      {isApplied ? (
                        <button type="button" className="btn btn-sm btn-ghost" onClick={removeCoupon}>Bỏ</button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          disabled={!meetsMin}
                          onClick={() => applyCoupon(c.code)}
                        >
                          {meetsMin ? "Dùng" : "Chưa đủ"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span>Tạm tính ({items.length} sản phẩm)</span>
              <span>{subtotal.toLocaleString("vi-VN")}₫</span>
            </div>
            {discount > 0 && (
              <div className="cart-summary-row">
                <span className="text-success">
                  <HiOutlineTicket aria-hidden /> Giảm giá
                </span>
                <span className="text-success">−{discount.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            <div className="cart-summary-row">
              <span className="cart-summary-row__ship">
                <HiOutlineTruck aria-hidden /> Phí vận chuyển
              </span>
              <span
                className={
                  shippingFee === 0 ? "cart-summary-row__free" : undefined
                }
              >
                {shippingFee === 0
                  ? "Miễn phí"
                  : `${shippingFee.toLocaleString("vi-VN")}₫`}
              </span>
            </div>
          </div>

          <div className="cart-summary-total-row">
            <span>Tổng thanh toán</span>
            <span>{grandTotal.toLocaleString("vi-VN")}₫</span>
          </div>

          <Link to={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon}` : ""}`} className="btn cart-summary-checkout">
            <HiOutlineCreditCard aria-hidden />
            Tiến hành thanh toán
          </Link>

          <Link to="/shop" className="cart-summary-back">
            <HiOutlineShoppingBag aria-hidden />
            Thêm sản phẩm khác
          </Link>
        </aside>
      </div>
    </div>
  );
}
