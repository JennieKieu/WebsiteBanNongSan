import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineEnvelope, HiOutlineUser, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import http from "../api/http";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await http.post("/contact", { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      toast.success("Đã gửi liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Gửi thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-lg" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div>
        <h1>
          <HiOutlineChatBubbleLeftRight style={{ verticalAlign: "middle", marginRight: 8 }} />
          Liên hệ
        </h1>
        <p className="text-muted">
          Gửi câu hỏi hoặc góp ý — đội ngũ Natural Store sẽ phản hồi qua email.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit} style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="form-group">
          <label className="form-label">
            <HiOutlineUser style={{ verticalAlign: "middle" }} /> Họ tên *
          </label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            <HiOutlineEnvelope style={{ verticalAlign: "middle" }} /> Email *
          </label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tiêu đề *</label>
          <input
            className="form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={3}
            placeholder="VD: Hỏi về đơn hàng"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nội dung *</label>
          <textarea
            className="form-input"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            placeholder="Nội dung chi tiết..."
          />
        </div>
        <button type="submit" className="btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Đang gửi..." : "Gửi liên hệ"}
        </button>
        <p style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/" className="auth-home">← Về trang chủ</Link>
        </p>
      </form>
    </div>
  );
}
