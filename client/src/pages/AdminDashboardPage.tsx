import { useMemo, useState } from "react";
import { HiOutlineBanknotes, HiOutlineClipboardDocumentList, HiOutlineExclamationTriangle, HiOutlineXCircle } from "react-icons/hi2";
import { useApi } from "../hooks/useApi";
import AdminListToolbar from "../components/AdminListToolbar";

const kpiConfig = [
  { key: "totalRevenue", label: "Doanh thu", icon: <HiOutlineBanknotes />, format: (v: number) => `${v.toLocaleString("vi-VN")}₫` },
  { key: "totalOrders", label: "Tổng đơn hàng", icon: <HiOutlineClipboardDocumentList />, format: (v: number) => String(v) },
  { key: "cancelRate", label: "Tỷ lệ huỷ", icon: <HiOutlineXCircle />, format: (v: number) => `${v}%` },
  { key: "nearExpiryCount", label: "Sắp hết hạn", icon: <HiOutlineExclamationTriangle />, format: (v: number) => `${v} lô` },
];

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi<any>("/admin/dashboard", []);
  const [topSearch, setTopSearch] = useState("");

  const filteredTopProducts = useMemo(() => {
    const list = data?.topProducts || [];
    const q = topSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p: { name?: string }) => (p.name || "").toLowerCase().includes(q));
  }, [data?.topProducts, topSearch]);

  if (loading) return <div className="loading-spinner">Đang tải bảng điều khiển...</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div className="stack-lg">
      <h1>Bảng điều khiển</h1>

      <div className="kpi-grid">
        {kpiConfig.map((kpi) => (
          <div className="kpi-card" key={kpi.key}>
            <div className="kpi-icon">{kpi.icon}</div>
            <span className="kpi-label">{kpi.label}</span>
            <span className="kpi-value">{kpi.format(data?.[kpi.key] ?? 0)}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Top sản phẩm bán chạy</h3>
        <p className="text-muted" style={{ marginBottom: 12, fontSize: "0.9rem" }}>
          Xếp hạng theo tổng số lượng đã bán trên các đơn <strong>Đã giao.</strong>
        </p>
        {(data?.topProducts || []).length === 0 ? (
          <p className="text-muted">Chưa có đơn đã giao hoặc chưa có dòng hàng để thống kê.</p>
        ) : (
          <>
            <AdminListToolbar
              search={topSearch}
              onSearchChange={setTopSearch}
              placeholder="Lọc theo tên sản phẩm..."
            />
            {filteredTopProducts.length === 0 ? (
              <p className="text-muted" style={{ marginTop: 12 }}>Không có sản phẩm khớp tìm kiếm.</p>
            ) : (
              <div className="table-container" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên sản phẩm</th>
                      <th>SL đã bán</th>
                      <th>Doanh thu hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopProducts.map((p: any, idx: number) => (
                      <tr key={String(p._id ?? p.name) + idx}>
                        <td>{idx + 1}</td>
                        <td>{p.name}</td>
                        <td><span className="badge badge-green">{p.soldCount}</span></td>
                        <td>{typeof p.revenue === "number" ? `${p.revenue.toLocaleString("vi-VN")}₫` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {data?.unresolvedContacts > 0 && (
        <div className="card" style={{ padding: 16, borderLeft: "4px solid var(--c-warning)" }}>
          <strong className="text-warning">
            <HiOutlineExclamationTriangle style={{ verticalAlign: "middle" }} /> {data.unresolvedContacts} liên hệ chưa xử lý
          </strong>
        </div>
      )}
    </div>
  );
}
