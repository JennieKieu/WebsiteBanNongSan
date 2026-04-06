import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineTruck, HiOutlineCreditCard } from "react-icons/hi2";
import http from "../api/http";

const FIELD_CONFIG = [
  { key: "receiverName", label: "Họ tên người nhận", placeholder: "Nguyễn Văn A" },
  { key: "receiverPhone", label: "Số điện thoại", placeholder: "0912 345 678" },
  { key: "province", label: "Tỉnh / Thành phố", placeholder: "TP. Hồ Chí Minh" },
  { key: "district", label: "Quận / Huyện", placeholder: "Quận 1" },
  { key: "ward", label: "Phường / Xã", placeholder: "Bến Nghé" },
  { key: "addressLine", label: "Địa chỉ cụ thể", placeholder: "123 Nguyễn Huệ" },
] as const;

type FormState = { [K in (typeof FIELD_CONFIG)[number]["key"]]: string };

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const couponCode = useMemo(
    () => (searchParams.get("coupon") || "").trim().toUpperCase() || "",
    [searchParams],
  );
  const [form, setForm] = useState<FormState>({
    receiverName: "",
    receiverPhone: "",
    province: "",
    district: "",
    ward: "",
    addressLine: "",
  });
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CashOnDelivery");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const invalid = FIELD_CONFIG.some((f) => !form[f.key].trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await http.post("/checkout/place-order", {
        shippingAddress: form,
        paymentMethod,
        note,
        couponCode: couponCode || undefined,
      });
      navigate(`/orders/${res.data.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-lg">
      <h1><HiOutlineTruck style={{ verticalAlign: "middle" }} /> Thanh toán</h1>

      {error && <div className="error-box">{error}</div>}

      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-form">
          <h2>Thông tin giao hàng</h2>
          {FIELD_CONFIG.map((f) => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label} *</label>
              <input
                className="form-input"
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                required
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <textarea
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho người giao hàng (tuỳ chọn)"
              rows={3}
            />
          </div>
        </div>

        <div className="stack">
          <div className="cart-summary">
            <h3><HiOutlineCreditCard style={{ verticalAlign: "middle" }} /> Phương thức thanh toán</h3>
            <div className="stack-sm" style={{ marginTop: 12 }}>
              {[
                ["CashOnDelivery", "Thanh toán khi nhận hàng (COD)"],
                ["BankTransfer", "Chuyển khoản ngân hàng"],
              ].map(([value, label]) => (
                <label key={value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ accentColor: "var(--c-primary)" }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button className="btn" type="submit" disabled={invalid || loading} style={{ width: "100%" }}>
            {loading ? "Đang xử lý..." : "Đặt hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
