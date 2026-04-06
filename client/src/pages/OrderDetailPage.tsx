import { useParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { useApi } from "../hooks/useApi";

const statusMap: Record<string, [string, string]> = {
  Pending: ["Mới đặt", "badge-orange"],
  Confirmed: ["Đã xác nhận", "badge-blue"],
  Packing: ["Đang đóng gói", "badge-blue"],
  Shipping: ["Đang giao", "badge-blue"],
  Delivered: ["Đã giao thành công", "badge-green"],
  DeliveryFailed: ["Giao thất bại", "badge-red"],
  RetryDelivery: ["Giao lại", "badge-orange"],
  Cancelled: ["Đã hủy", "badge-red"],
};

const paymentLabels: Record<string, string> = {
  CashOnDelivery: "Thanh toán khi nhận hàng",
  BankTransfer: "Chuyển khoản ngân hàng",
  CreditCard: "Thẻ tín dụng",
  Ewallet: "Ví điện tử",
};

export default function OrderDetailPage() {
  const { id = "" } = useParams();
  const { data, loading, error } = useApi<any>(`/orders/${id}`, [id]);

  if (loading) return <div className="loading-spinner">Đang tải đơn hàng...</div>;
  if (error) return <div className="error-box">{error}</div>;

  const [statusLabel, statusClass] = statusMap[data?.status] || ["—", "badge-gray"];
  const addr = data?.shippingAddress || {};
  const fullAddr = [addr.addressLine, addr.ward, addr.district, addr.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="stack-lg">
      <h1>
        <HiOutlineClipboardDocumentList style={{ verticalAlign: "middle" }} /> Đơn hàng{" "}
        {data?.orderCode}
      </h1>

      <div className="order-card">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <span>Trạng thái</span>
          <span className={`badge ${statusClass}`}>{statusLabel}</span>
        </div>

        <div className="order-popup-sections">
          <div className="order-popup-section">
            <h4>Người nhận</h4>
            <div className="order-popup-info-grid">
              <span className="order-popup-label">Họ tên:</span>
              <span>{addr.receiverName || data?.guestInfo?.name || "—"}</span>
              <span className="order-popup-label">SĐT:</span>
              <span>{addr.receiverPhone || data?.guestInfo?.phone || "—"}</span>
              <span className="order-popup-label">Địa chỉ:</span>
              <span>{fullAddr || "—"}</span>
            </div>
          </div>

          <div className="order-popup-section">
            <h4>Thanh toán</h4>
            <span>{paymentLabels[data?.paymentMethod] || data?.paymentMethod || "—"}</span>
            {data?.couponCode && (
              <span className="badge badge-blue" style={{ marginLeft: 8 }}>{data.couponCode}</span>
            )}
          </div>

          {data?.note && (
            <div className="order-popup-section">
              <h4>Ghi chú</h4>
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>{data.note}</p>
            </div>
          )}
        </div>

        <div className="table-container" style={{ marginTop: 16 }}>
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
              {(data?.items || []).map((item: any, idx: number) => (
                <tr key={`${item.productName}-${idx}`}>
                  <td>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                        />
                      )}
                      <div>
                        <strong>{item.productName}</strong>
                        <br />
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                          {item.supplier || item.originProvince || "—"} · {item.unit}
                          {item.batchCode && ` · Lô: ${item.batchCode}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>{(item.unitPrice || 0).toLocaleString("vi-VN")}₫</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{(item.subtotal || 0).toLocaleString("vi-VN")}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="order-popup-summary" style={{ marginTop: 16 }}>
          <div className="order-popup-summary-row">
            <span>Tạm tính</span>
            <span>{(data?.subtotal || 0).toLocaleString("vi-VN")}₫</span>
          </div>
          {(data?.discount || 0) > 0 && (
            <div className="order-popup-summary-row">
              <span>Giảm giá</span>
              <span className="text-success">-{data.discount.toLocaleString("vi-VN")}₫</span>
            </div>
          )}
          <div className="order-popup-summary-row">
            <span>Phí vận chuyển</span>
            <span>{data?.shippingFee === 0 ? "Miễn phí" : `${(data?.shippingFee || 0).toLocaleString("vi-VN")}₫`}</span>
          </div>
          <div className="order-popup-summary-row order-popup-summary-total">
            <span>Tổng cộng</span>
            <span>{(data?.total || 0).toLocaleString("vi-VN")}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
}
