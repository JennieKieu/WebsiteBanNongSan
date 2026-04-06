import { useEffect, useState } from "react";
import {
  HiOutlineXMark,
  HiOutlinePrinter,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import http from "../api/http";
import { useAuthStore } from "../store/useAuthStore";
import { formatDateTimeVN } from "../utils/vnDatetime";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Mới đặt",
  Confirmed: "Đã xác nhận",
  Packing: "Đang đóng gói",
  Shipping: "Đang giao",
  Delivered: "Đã giao thành công",
  DeliveryFailed: "Giao thất bại",
  RetryDelivery: "Giao lại",
  Cancelled: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "badge-orange",
  Confirmed: "badge-blue",
  Packing: "badge-blue",
  Shipping: "badge-blue",
  Delivered: "badge-green",
  DeliveryFailed: "badge-red",
  RetryDelivery: "badge-orange",
  Cancelled: "badge-red",
};

const PAYMENT_LABELS: Record<string, string> = {
  CashOnDelivery: "Thanh toán khi nhận hàng",
  BankTransfer: "Chuyển khoản ngân hàng",
  CreditCard: "Thẻ tín dụng",
  Ewallet: "Ví điện tử",
};


export function printInvoice(order: any) {
  const items = order.items || [];
  const addr = order.shippingAddress || {};
  const fullAddr = [addr.addressLine, addr.ward, addr.district, addr.province]
    .filter(Boolean)
    .join(", ");

  const itemRows = items
    .map(
      (it: any, i: number) => `
    <tr>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:center">${i + 1}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee">
        ${it.productName || "—"}
        <br/><small style="color:#888">${it.supplier || ""} · ${it.unit || ""}</small>
        ${it.batchCode ? `<br/><small style="color:#888">Lô: ${it.batchCode}</small>` : ""}
      </td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right">${(it.unitPrice || 0).toLocaleString("vi-VN")}₫</td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${(it.subtotal || 0).toLocaleString("vi-VN")}₫</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Hóa đơn ${order.orderCode}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#222;padding:30px;max-width:800px;margin:0 auto;font-size:14px}
  h1{font-size:22px;color:#2E7D32;margin-bottom:4px}
  .subtitle{color:#888;font-size:13px;margin-bottom:24px}
  .section{margin-bottom:20px}
  .section-title{font-size:15px;font-weight:700;margin-bottom:8px;color:#333;border-bottom:2px solid #2E7D32;padding-bottom:4px;display:inline-block}
  .info-grid{display:grid;grid-template-columns:140px 1fr;gap:4px 12px;font-size:13px}
  .info-label{color:#666;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:13px}
  thead th{background:#f5f5f5;padding:10px 6px;text-align:left;font-weight:700;border-bottom:2px solid #ddd}
  .summary{margin-top:16px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:13px}
  .summary-row{display:flex;gap:24px;min-width:260px;justify-content:space-between}
  .summary-total{font-size:16px;font-weight:700;color:#2E7D32;border-top:2px solid #2E7D32;padding-top:8px;margin-top:4px}
  .footer{margin-top:32px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:16px}
  @media print{body{padding:15px}button{display:none!important}}
</style>
</head>
<body>
  <h1>NaturalStore</h1>
  <p class="subtitle">Hóa đơn bán hàng</p>

  <div class="section">
    <div class="section-title">Thông tin đơn hàng</div>
    <div class="info-grid">
      <span class="info-label">Mã đơn:</span><span>${order.orderCode}</span>
      <span class="info-label">Ngày đặt:</span><span>${formatDateTimeVN(order.createdAt)}</span>
      <span class="info-label">Thanh toán:</span><span>${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "—"}</span>
      ${order.couponCode ? `<span class="info-label">Mã giảm giá:</span><span>${order.couponCode}</span>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Người nhận</div>
    <div class="info-grid">
      <span class="info-label">Họ tên:</span><span>${addr.receiverName || order.guestInfo?.name || "—"}</span>
      <span class="info-label">Điện thoại:</span><span>${addr.receiverPhone || order.guestInfo?.phone || "—"}</span>
      <span class="info-label">Địa chỉ:</span><span>${fullAddr || "—"}</span>
      ${addr.note ? `<span class="info-label">Ghi chú:</span><span>${addr.note}</span>` : ""}
    </div>
  </div>

  ${order.note ? `<div class="section"><div class="section-title">Ghi chú đơn hàng</div><p style="font-size:13px">${order.note}</p></div>` : ""}

  <div class="section">
    <div class="section-title">Chi tiết sản phẩm</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center">STT</th>
          <th>Sản phẩm</th>
          <th style="text-align:right">Đơn giá</th>
          <th style="text-align:center;width:50px">SL</th>
          <th style="text-align:right">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>Tạm tính:</span><span>${(order.subtotal || 0).toLocaleString("vi-VN")}₫</span></div>
      ${(order.discount || 0) > 0 ? `<div class="summary-row"><span>Giảm giá:</span><span style="color:#2E7D32">-${order.discount.toLocaleString("vi-VN")}₫</span></div>` : ""}
      <div class="summary-row"><span>Phí vận chuyển:</span><span>${order.shippingFee === 0 ? "Miễn phí" : `${(order.shippingFee || 0).toLocaleString("vi-VN")}₫`}</span></div>
      <div class="summary-row summary-total"><span>Tổng cộng:</span><span>${(order.total || 0).toLocaleString("vi-VN")}₫</span></div>
    </div>
  </div>

  <div class="footer">
    Cảm ơn bạn đã mua hàng tại NaturalStore!<br/>
    In ngày: ${formatDateTimeVN(new Date())}
  </div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=820,height=900");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }
}

type Props = {
  orderId: string;
  onClose: () => void;
  onStatusChanged?: () => void;
};

export default function OrderDetailPopup({ orderId, onClose, onStatusChanged }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAdmin = useAuthStore((s) => s.user?.role === "Admin");
  const [nextStatus, setNextStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    http
      .get(`/orders/${orderId}`)
      .then((res) => {
        if (!cancelled) setOrder(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải đơn hàng");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const addr = order?.shippingAddress || {};
  const fullAddr = [addr.addressLine, addr.ward, addr.district, addr.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card order-detail-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            <HiOutlineClipboardDocumentList style={{ verticalAlign: "middle" }} />{" "}
            Chi tiết đơn hàng
          </h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {order && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => printInvoice(order)}
                title="In hóa đơn"
              >
                <HiOutlinePrinter /> In hóa đơn
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={onClose}>
              <HiOutlineXMark />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-spinner" style={{ padding: 40 }}>
              Đang tải...
            </div>
          )}
          {error && <div className="error-box">{error}</div>}
          {order && !loading && (
            <div className="order-popup-content">
              <div className="order-popup-header">
                <div>
                  <span className="order-popup-code">{order.orderCode}</span>
                  <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                    {formatDateTimeVN(order.createdAt)}
                  </span>
                </div>
                <span
                  className={`badge ${STATUS_COLORS[order.status] || "badge-gray"}`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {isAdmin && (
                <div className="order-popup-status-change">
                  <label className="order-popup-label" style={{ whiteSpace: "nowrap" }}>
                    Đổi trạng thái:
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) => { setNextStatus(e.target.value); setStatusMsg(""); }}
                    className="admin-filter-select"
                    style={{ flex: 1, minWidth: 150 }}
                  >
                    <option value="">— Chọn —</option>
                    {Object.entries(STATUS_LABELS)
                      .filter(([key]) => key !== order.status)
                      .map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={!nextStatus || updatingStatus}
                    onClick={async () => {
                      setUpdatingStatus(true);
                      setStatusMsg("");
                      try {
                        await http.put(`/admin/orders/${orderId}/status`, { status: nextStatus });
                        setOrder((prev: any) => ({ ...prev, status: nextStatus }));
                        setNextStatus("");
                        setStatusMsg("Đã cập nhật!");
                        onStatusChanged?.();
                      } catch {
                        setStatusMsg("Cập nhật thất bại");
                      } finally {
                        setUpdatingStatus(false);
                      }
                    }}
                  >
                    <HiOutlineArrowPath />
                    {updatingStatus ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                  {statusMsg && (
                    <span
                      className={statusMsg.includes("thất bại") ? "text-error" : "text-success"}
                      style={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}
                    >
                      {statusMsg}
                    </span>
                  )}
                </div>
              )}

              <div className="order-popup-sections">
                <div className="order-popup-section">
                  <h4>Người nhận</h4>
                  <div className="order-popup-info-grid">
                    <span className="order-popup-label">Họ tên:</span>
                    <span>
                      {addr.receiverName || order.guestInfo?.name || "—"}
                    </span>
                    <span className="order-popup-label">SĐT:</span>
                    <span>
                      {addr.receiverPhone || order.guestInfo?.phone || "—"}
                    </span>
                    <span className="order-popup-label">Địa chỉ:</span>
                    <span>{fullAddr || "—"}</span>
                    {addr.note && (
                      <>
                        <span className="order-popup-label">Ghi chú:</span>
                        <span>{addr.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="order-popup-section">
                  <h4>Thanh toán</h4>
                  <span>
                    {PAYMENT_LABELS[order.paymentMethod] ||
                      order.paymentMethod ||
                      "—"}
                  </span>
                  {order.couponCode && (
                    <span className="badge badge-blue" style={{ marginLeft: 8 }}>
                      {order.couponCode}
                    </span>
                  )}
                </div>

                {order.note && (
                  <div className="order-popup-section">
                    <h4>Ghi chú</h4>
                    <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                      {order.note}
                    </p>
                  </div>
                )}

                <div className="order-popup-section">
                  <h4>Sản phẩm</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th style={{ textAlign: "right" }}>Đơn giá</th>
                          <th style={{ textAlign: "center" }}>SL</th>
                          <th style={{ textAlign: "right" }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items || []).map((it: any, idx: number) => (
                          <tr key={`${it.productName}-${idx}`}>
                            <td>
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                {it.productImage && (
                                  <img
                                    src={it.productImage}
                                    alt=""
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 6,
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                                <div>
                                  <strong>{it.productName}</strong>
                                  <br />
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    {it.supplier || it.originProvince || "—"} ·{" "}
                                    {it.unit}
                                    {it.batchCode && ` · Lô: ${it.batchCode}`}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {(it.unitPrice || 0).toLocaleString("vi-VN")}₫
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {it.quantity}
                            </td>
                            <td
                              style={{ textAlign: "right", fontWeight: 600 }}
                            >
                              {(it.subtotal || 0).toLocaleString("vi-VN")}₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="order-popup-summary">
                  <div className="order-popup-summary-row">
                    <span>Tạm tính</span>
                    <span>
                      {(order.subtotal || 0).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  {(order.discount || 0) > 0 && (
                    <div className="order-popup-summary-row">
                      <span>Giảm giá</span>
                      <span className="text-success">
                        -{order.discount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}
                  <div className="order-popup-summary-row">
                    <span>Phí vận chuyển</span>
                    <span>
                      {order.shippingFee === 0
                        ? "Miễn phí"
                        : `${(order.shippingFee || 0).toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>
                  <div className="order-popup-summary-row order-popup-summary-total">
                    <span>Tổng cộng</span>
                    <span>
                      {(order.total || 0).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
