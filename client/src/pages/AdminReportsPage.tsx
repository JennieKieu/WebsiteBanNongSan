import { useEffect, useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineClipboardDocumentList,
  HiOutlineXCircle,
  HiOutlineShoppingCart,
  HiOutlineUserGroup,
  HiOutlineUserPlus,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineArchiveBox,
  HiOutlineTicket,
  HiOutlineScale,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import http from "../api/http";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Packing: "Đang đóng gói",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  DeliveryFailed: "Giao thất bại",
  RetryDelivery: "Giao lại",
  Cancelled: "Đã huỷ",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "#F59E0B",
  Confirmed: "#3B82F6",
  Packing: "#8B5CF6",
  Shipping: "#06B6D4",
  Delivered: "#10B981",
  DeliveryFailed: "#EF4444",
  RetryDelivery: "#F97316",
  Cancelled: "#6B7280",
};

const RANGES = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
  { value: "365d", label: "1 năm" },
  { value: "all", label: "Tất cả" },
];

function fmt(v: number) {
  return v.toLocaleString("vi-VN");
}

function chartAxisMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(Math.round(n));
}

function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; dataKey?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="report-chart-tooltip"
      style={{
        background: "var(--c-surface, #fff)",
        border: "1px solid var(--c-border, #e5e7eb)",
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 13,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} style={{ color: "var(--c-text-muted, #666)" }}>
          <span style={{ color: "var(--c-text, #111)" }}>{p.name}: </span>
          {fmt(p.value ?? 0)}₫
        </div>
      ))}
    </div>
  );
}

/** Ngày hôm nay theo giờ máy (không dùng toISOString — tránh lệch UTC làm khóa nhầm ngày trong ô type=date). */
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminReportsPage() {
  const [range, setRange] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchReport(params: { range?: string; from?: string; to?: string }) {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (params.from) q.set("from", params.from);
      if (params.to) q.set("to", params.to);
      if (params.range) q.set("range", params.range);
      const res = await http.get(`/admin/reports?${q.toString()}`);
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (useCustom) return;
    fetchReport({ range });
  }, [range, useCustom]);

  function handleRangeChange(r: string) {
    setUseCustom(false);
    setRange(r);
  }

  function handleApplyCustom() {
    if (!customFrom) return;
    setUseCustom(true);
    fetchReport({ from: customFrom, to: customTo || todayStr() });
  }

  function handleCustomFromChange(v: string) {
    setCustomFrom(v);
    setUseCustom(false);
  }

  function handleCustomToChange(v: string) {
    setCustomTo(v);
    setUseCustom(false);
  }

  if (loading) return <div className="loading-spinner">Đang tải báo cáo...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return null;

  const s = data.summary;
  const f = {
    revenueTimeline: data.revenueTimeline || [],
    ordersTimeline: data.ordersTimeline || [],
    ordersByStatus: data.ordersByStatus || [],
    revenueByCategory: data.revenueByCategory || [],
    topProducts: data.topProducts || [],
    lowStockProducts: data.lowStockProducts || [],
  };
  const totalCogs = typeof s.totalCogs === "number" ? s.totalCogs : 0;
  const grossProfit = typeof s.grossProfit === "number" ? s.grossProfit : 0;
  const totalNetSales = typeof s.totalNetSales === "number" ? s.totalNetSales : s.totalRevenue;
  const maxTopRev = Math.max(...(f.topProducts || []).map((p: any) => p.revenue), 1);
  const timelineChartData = (f.revenueTimeline || []).map((r: any) => ({
    date: r.date,
    netSales: r.netSales ?? r.revenue ?? 0,
    cogs: r.cogs ?? 0,
    grossProfit: r.grossProfit ?? (r.netSales ?? r.revenue ?? 0) - (r.cogs ?? 0),
  }));
  const pieStatusData = (f.ordersByStatus || []).map((x: any) => ({
    name: STATUS_LABELS[x.status] || x.status,
    value: x.count,
    status: x.status,
  }));

  return (
    <div className="stack-lg">
      <div className="row-between">
        <h1>Thống kê &amp; Báo cáo</h1>
      </div>

      {/* Bộ lọc thời gian */}
      <div className="card report-section" style={{ padding: "14px 20px" }}>
        <div className="report-filter-row">
          <div className="report-range-group">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`report-range-btn ${!useCustom && range === r.value ? "active" : ""}`}
                onClick={() => handleRangeChange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="report-filter-sep">hoặc</span>
          <div className="report-daterange-group">
            <label className="report-daterange-label">Từ ngày</label>
            <input
              type="date"
              className="report-date-input"
              value={customFrom}
              max={customTo || todayStr()}
              onChange={(e) => handleCustomFromChange(e.target.value)}
            />
            <label className="report-daterange-label">đến ngày</label>
            <input
              type="date"
              className="report-date-input"
              value={customTo}
              min={customFrom || undefined}
              max={todayStr()}
              onChange={(e) => handleCustomToChange(e.target.value)}
            />
            <button
              type="button"
              className={`report-range-btn${useCustom ? " active" : ""}`}
              disabled={!customFrom}
              onClick={handleApplyCustom}
            >
              Áp dụng
            </button>
          </div>
        </div>
        {useCustom && customFrom && (
          <p className="text-muted" style={{ marginTop: 8, fontSize: "0.82rem" }}>
            Đang hiển thị từ <strong>{customFrom}</strong> đến <strong>{customTo || todayStr()}</strong>
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <p className="text-muted" style={{ margin: "-8px 0 0", fontSize: "0.9rem" }}>
        Lợi nhuận gộp = doanh thu hàng (sau khuyến mãi) − giá vốn theo lô đã xuất kho (đơn trạng thái Đã giao).
      </p>
      <div className="report-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--c-primary)" }}><HiOutlineBanknotes /></div>
          <span className="kpi-label">Tổng thu (đã giao)</span>
          <span className="kpi-value">{fmt(s.totalRevenue)}₫</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#0D9488" }}><HiOutlineBanknotes /></div>
          <span className="kpi-label">Doanh thu hàng (sau KM)</span>
          <span className="kpi-value">{fmt(totalNetSales)}₫</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#EA580C" }}><HiOutlineScale /></div>
          <span className="kpi-label">Giá vốn (tiền nhập)</span>
          <span className="kpi-value">{fmt(totalCogs)}₫</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#2563EB" }}><HiOutlineArrowTrendingUp /></div>
          <span className="kpi-label">Lợi nhuận gộp</span>
          <span className="kpi-value">{fmt(grossProfit)}₫</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#3B82F6" }}><HiOutlineClipboardDocumentList /></div>
          <span className="kpi-label">Tổng đơn hàng</span>
          <span className="kpi-value">{s.totalOrders}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#8B5CF6" }}><HiOutlineShoppingCart /></div>
          <span className="kpi-label">Giá trị trung bình / đơn</span>
          <span className="kpi-value">{fmt(s.avgOrderValue)}₫</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--c-success)" }}><HiOutlineClipboardDocumentList /></div>
          <span className="kpi-label">Đã giao</span>
          <span className="kpi-value">{s.deliveredCount}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--c-error)" }}><HiOutlineXCircle /></div>
          <span className="kpi-label">Tỷ lệ huỷ</span>
          <span className="kpi-value">{s.cancelRate}%</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#06B6D4" }}><HiOutlineUserGroup /></div>
          <span className="kpi-label">Tổng khách hàng</span>
          <span className="kpi-value">{data.customerStats.totalCustomers}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#10B981" }}><HiOutlineUserPlus /></div>
          <span className="kpi-label">Khách hàng mới</span>
          <span className="kpi-value">{data.customerStats.newCustomers}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "#F59E0B" }}><HiOutlineTicket /></div>
          <span className="kpi-label">Voucher đã dùng</span>
          <span className="kpi-value">{data.couponStats.totalUsed} / {data.couponStats.totalCoupons}</span>
        </div>
      </div>

      {/* Biểu đồ: doanh thu hàng, giá vốn, LN gộp */}
      <div className="card report-section">
        <h3>Doanh thu hàng, giá vốn &amp; lợi nhuận gộp theo ngày</h3>
        {timelineChartData.length === 0 ? (
          <p className="text-muted">Chưa có dữ liệu</p>
        ) : (
          <div className="report-recharts-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={chartAxisMoney} tick={{ fontSize: 11 }} width={48} />
                <Tooltip content={<MoneyTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="netSales" name="Doanh thu hàng (sau KM)" stroke="#0D9488" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cogs" name="Giá vốn (tiền nhập)" stroke="#EA580C" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="grossProfit" name="Lợi nhuận gộp" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card report-section">
        <h3>Số đơn hàng theo ngày</h3>
        {(f.ordersTimeline || []).length === 0 ? (
          <p className="text-muted">Chưa có dữ liệu</p>
        ) : (
          <div className="report-recharts-wrap report-recharts-wrap--compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={f.ordersTimeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                <Tooltip
                  formatter={(value: number) => [value, "Số đơn"]}
                  labelFormatter={(l) => `Ngày ${l}`}
                />
                <Bar dataKey="count" name="Đơn" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="report-row-2col">
        {/* Orders by Status */}
        <div className="card report-section">
          <h3>Đơn hàng theo trạng thái</h3>
          {pieStatusData.length === 0 ? (
            <p className="text-muted">Chưa có dữ liệu</p>
          ) : (
            <>
              <div className="report-recharts-wrap report-recharts-wrap--compact">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={1}
                    >
                      {pieStatusData.map((row: { status: string }) => (
                        <Cell key={row.status} fill={STATUS_COLORS[row.status] || "#9CA3AF"} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Số đơn"]} />
                    <Legend layout="horizontal" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="report-status-list" style={{ marginTop: 12 }}>
                {f.ordersByStatus.map((st: any) => (
                  <div key={st.status} className="report-status-item">
                    <span className="report-status-dot" style={{ background: STATUS_COLORS[st.status] || "#999" }} />
                    <span className="report-status-label">{STATUS_LABELS[st.status] || st.status}</span>
                    <span className="report-status-count">{st.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="card report-section">
          <h3>Doanh thu theo danh mục</h3>
          {(f.revenueByCategory || []).length === 0 ? (
            <p className="text-muted">Chưa có dữ liệu</p>
          ) : (
            <div className="report-recharts-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={f.revenueByCategory} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal />
                  <XAxis type="number" tickFormatter={chartAxisMoney} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#7E57C2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="card report-section">
        <h3>Top 10 sản phẩm bán chạy</h3>
        {f.topProducts.length === 0 ? (
          <p className="text-muted">Chưa có dữ liệu</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th style={{ textAlign: "right" }}>Số lượng</th>
                  <th style={{ textAlign: "right" }}>Doanh thu</th>
                  <th style={{ textAlign: "right" }}>Giá vốn</th>
                  <th style={{ textAlign: "right" }}>LN gộp</th>
                  <th style={{ width: "22%" }}></th>
                </tr>
              </thead>
              <tbody>
                {f.topProducts.map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td><span className="badge badge-green">{idx + 1}</span></td>
                    <td>{p.name}</td>
                    <td style={{ textAlign: "right" }}>{fmt(p.quantity)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(p.revenue)}₫</td>
                    <td style={{ textAlign: "right" }}>{fmt(p.importCost ?? 0)}₫</td>
                    <td style={{ textAlign: "right" }}>{fmt(p.grossProfit ?? (p.revenue - (p.importCost ?? 0)))}₫</td>
                    <td>
                      <div className="report-bar-track" style={{ height: 8 }}>
                        <div
                          className="report-bar-fill report-bar-fill--green"
                          style={{ width: `${(p.revenue / maxTopRev) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="report-row-2col">
        {/* Inventory Summary */}
        <div className="card report-section">
          <h3><HiOutlineCube style={{ verticalAlign: "middle" }} /> Tổng quan tồn kho</h3>
          <div className="report-stat-grid">
            <div className="report-stat-item">
              <span className="report-stat-num">{data.inventorySummary.totalBatches}</span>
              <span className="report-stat-desc">Tổng lô hàng</span>
            </div>
            <div className="report-stat-item">
              <span className="report-stat-num" style={{ color: "var(--c-success)" }}>{data.inventorySummary.activeBatches}</span>
              <span className="report-stat-desc">Đang hoạt động</span>
            </div>
            <div className="report-stat-item">
              <span className="report-stat-num" style={{ color: "var(--c-warning)" }}>{data.inventorySummary.nearExpiryBatches}</span>
              <span className="report-stat-desc">Sắp hết hạn</span>
            </div>
            <div className="report-stat-item">
              <span className="report-stat-num" style={{ color: "var(--c-error)" }}>{data.inventorySummary.expiredBatches}</span>
              <span className="report-stat-desc">Hết hạn</span>
            </div>
            <div className="report-stat-item">
              <span className="report-stat-num" style={{ color: "#6B7280" }}>{data.inventorySummary.outOfStockBatches}</span>
              <span className="report-stat-desc">Hết hàng</span>
            </div>
            <div className="report-stat-item">
              <span className="report-stat-num">{fmt(data.inventorySummary.totalStockValue)}₫</span>
              <span className="report-stat-desc">Giá trị tồn kho</span>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card report-section">
          <h3><HiOutlineExclamationTriangle style={{ verticalAlign: "middle", color: "var(--c-warning)" }} /> Sản phẩm sắp hết hàng</h3>
          {f.lowStockProducts.length === 0 ? (
            <p className="text-muted">Không có sản phẩm nào tồn kho thấp</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: "right" }}>Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {f.lowStockProducts.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td>{p.name}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`badge ${p.stock <= 3 ? "badge-red" : "badge-yellow"}`}>{p.stock}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Coupon & Archive */}
      <div className="card report-section">
        <h3><HiOutlineArchiveBox style={{ verticalAlign: "middle" }} /> Voucher / Mã giảm giá</h3>
        <div className="report-stat-grid">
          <div className="report-stat-item">
            <span className="report-stat-num">{data.couponStats.totalCoupons}</span>
            <span className="report-stat-desc">Tổng mã</span>
          </div>
          <div className="report-stat-item">
            <span className="report-stat-num" style={{ color: "var(--c-success)" }}>{data.couponStats.activeCoupons}</span>
            <span className="report-stat-desc">Đang hoạt động</span>
          </div>
          <div className="report-stat-item">
            <span className="report-stat-num" style={{ color: "#3B82F6" }}>{data.couponStats.totalUsed}</span>
            <span className="report-stat-desc">Lượt sử dụng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
