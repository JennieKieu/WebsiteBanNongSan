import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn,
  HiOutlineXMark,
} from "react-icons/hi2";
import http from "../api/http";

type Recommendation = {
  productId: string;
  name: string;
  unit?: string;
  price?: number;
  reason: string;
  matchScore: number;
};

type ChatResponse = {
  answer: string;
  recommendations: Recommendation[];
};

type ChatLog =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; recommendations?: Recommendation[] };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<ChatLog[]>([
    { role: "assistant", text: "Xin chào! Mình là trợ lý AI của Natural Store 🌿\nBạn cần tư vấn nông sản gì hôm nay?" },
  ]);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    http
      .post("/chat/session", { guestId: crypto.randomUUID() })
      .then((res) => setSessionId(res.data.data._id))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [logs]);

  async function sendMessage() {
    if (!message.trim() || !sessionId || loading) return;
    const m = message.trim();
    setMessage("");
    setLoading(true);
    setLogs((prev) => [...prev, { role: "user", text: m }]);
    try {
      const res = await http.post("/chat/message", { sessionId, message: m });
      const data = res.data.data as ChatResponse;
      setLogs((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          recommendations: data.recommendations,
        },
      ]);
    } catch {
      setLogs((prev) => [
        ...prev,
        { role: "assistant", text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const panelCls = `chat-panel${expanded ? " chat-panel--expanded" : ""}`;

  return (
    <div className="chat-widget">
      {open ? (
        <div className={panelCls}>
          <div className="chat-panel-header">
            <strong>
              <HiOutlineChatBubbleLeftRight /> Tư vấn AI
            </strong>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Thu nhỏ" : "Phóng to"}
                title={expanded ? "Thu nhỏ" : "Phóng to"}
              >
                {expanded ? <HiOutlineArrowsPointingIn /> : <HiOutlineArrowsPointingOut />}
              </button>
              <button onClick={() => { setOpen(false); setExpanded(false); }}>
                <HiOutlineXMark />
              </button>
            </div>
          </div>

          <div className="chat-body" ref={bodyRef}>
            {logs.map((log, idx) => (
              <div
                key={`${log.role}-${idx}`}
                className={`chat-bubble ${log.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
              >
                <span className="chat-bubble-text">{log.text}</span>

                {log.role === "assistant" && log.recommendations && log.recommendations.length > 0 && (
                  <div className="chat-recs">
                    {log.recommendations.map((r) => (
                      <Link
                        key={r.productId}
                        to={`/products/${r.productId}`}
                        className="chat-rec-card"
                        onClick={() => { setOpen(false); setExpanded(false); }}
                      >
                        <span className="chat-rec-name">{r.name}</span>
                        {r.price != null && (
                          <span className="chat-rec-price">
                            {r.price.toLocaleString("vi-VN")}₫{r.unit ? ` / ${r.unit}` : ""}
                          </span>
                        )}
                        <span className="chat-rec-reason">{r.reason}</span>
                        <span className="chat-rec-score">
                          {Math.round(r.matchScore * 100)}% phù hợp
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="chat-bubble chat-bubble-ai">Đang suy nghĩ...</div>}
          </div>

          <div className="chat-input-bar">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập nhu cầu của bạn..."
              aria-label="Nhập tin nhắn"
            />
            <button onClick={sendMessage} disabled={loading || !message.trim()} aria-label="Gửi">
              <HiOutlinePaperAirplane />
            </button>
          </div>
        </div>
      ) : (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Mở tư vấn AI">
          <HiOutlineChatBubbleLeftRight />
        </button>
      )}
    </div>
  );
}
