import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBell } from "react-icons/hi2";
import http from "../api/http";
import { formatDateVN } from "../utils/vnDatetime";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  meta?: {
    productId?: string;
    batchId?: string;
    batchCode?: string;
    orderId?: string;
    contactId?: string;
    couponId?: string;
    code?: string;
  };
}

/** Ưu tiên trang chi tiết sản phẩm admin cho thông báo lô hàng (kể cả bản ghi cũ có meta). */
function resolveNotificationTarget(n: Notification): string | null {
  const meta = n.meta || {};
  if (n.type === "BATCH_NEAR_EXPIRY" || n.type === "BATCH_EXPIRED") {
    const pid = meta.productId;
    if (pid) return `/admin/products/${pid}`;
  }
  if (n.link) return n.link;
  return null;
}

const TYPE_COLORS: Record<string, string> = {
  ORDER_STATUS: "var(--c-primary)",
  NEW_ORDER: "var(--c-success)",
  BATCH_NEAR_EXPIRY: "var(--c-warning)",
  BATCH_EXPIRED: "var(--c-error)",
  COUPON_NEAR_EXPIRY: "var(--c-warning)",
  COUPON_EXPIRED: "var(--c-error)",
  NEW_CONTACT: "#1976D2",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return formatDateVN(dateStr);
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await http.get("/notifications?limit=30");
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      try {
        await http.patch(`/notifications/${n._id}/read`);
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    const target = resolveNotificationTarget(n);
    if (target) navigate(target);
  }

  async function handleMarkAllRead() {
    try {
      await http.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="notif-wrapper" ref={panelRef}>
      <button
        type="button"
        className="header-icon-btn notif-trigger"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        aria-label="Thông báo"
        title="Thông báo"
      >
        <HiOutlineBell />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <strong>Thông báo</strong>
            {unreadCount > 0 && (
              <button type="button" className="notif-mark-all" onClick={handleMarkAllRead}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notif-panel-body">
            {loading && notifications.length === 0 && (
              <p className="notif-empty">Đang tải...</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="notif-empty">Không có thông báo</p>
            )}
            {notifications.map((n) => (
              <button
                key={n._id}
                type="button"
                className={`notif-item ${n.isRead ? "" : "notif-item--unread"}`}
                onClick={() => handleClick(n)}
              >
                <span
                  className="notif-dot"
                  style={{ background: TYPE_COLORS[n.type] || "var(--c-text-muted)" }}
                />
                <div className="notif-item-content">
                  <span className="notif-item-title">{n.title}</span>
                  <span className="notif-item-msg">{n.message}</span>
                  <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
