import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineShieldCheck } from "react-icons/hi2";
import http from "../api/http";
import { useAuthStore } from "../store/useAuthStore";

type Step = "auth" | "verify" | "forgot" | "reset";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<Step>("auth");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await http.post("/auth/register", { name, email, password });
        setStep("verify");
        toast.success("Mã OTP đã được gửi tới email của bạn!");
        return;
      }
      const res = await http.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.data.accessToken);
      localStorage.setItem("refreshToken", res.data.data.refreshToken);
      setUser(res.data.data.user);
      navigate(res.data.data.user.role === "Admin" ? "/admin" : "/");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED" ? "Hết thời gian chờ máy chủ (thử lại hoặc kiểm tra API)." : null) ||
        "Đăng nhập / đăng ký thất bại";
      setError(msg);
      if (isRegister) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !password) {
      setError("Thiếu thông tin đăng ký. Vui lòng quay lại và đăng ký lại.");
      return;
    }
    setLoading(true);
    try {
      await http.post("/auth/verify-otp", { email, otp, name, password });
      toast.success("Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay.");
      setStep("auth");
      setIsRegister(false);
      setOtp("");
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await http.post("/auth/forgot-password", { email });
      toast.success("Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn!");
      setStep("reset");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi email, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await http.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      setStep("auth");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  }

  // ── Step: Xác minh OTP đăng ký (chỉ nhập OTP — họ tên/mật khẩu lấy từ bước đăng ký trong bộ nhớ) ──
  if (step === "verify") {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleVerify}>
          <h1><HiOutlineShieldCheck /> Xác minh OTP</h1>
          <p className="auth-subtitle">
            Vui lòng nhập mã OTP 6 số đã gửi tới email <strong>{email}</strong> (kiểm tra cả thư mục spam).
          </p>
          {error && <div className="error-box">{error}</div>}
          <div className="form-group">
            <label className="form-label">Mã OTP</label>
            <input
              className="form-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập 6 chữ số"
              maxLength={6}
              autoFocus
            />
          </div>
          <button className="btn" disabled={loading}>{loading ? "Đang xác minh..." : "Xác minh"}</button>
          <div className="auth-toggle">
            <button type="button" onClick={() => { setStep("auth"); setError(""); }}>← Quay lại</button>
          </div>
        </form>
      </div>
    );
  }

  // ── Step: Nhập email quên mật khẩu ──────────────────────────────────────────
  if (step === "forgot") {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleForgot}>
          <h1><HiOutlineEnvelope /> Quên mật khẩu</h1>
          <p className="auth-subtitle">Nhập email tài khoản của bạn để nhận mã OTP đặt lại mật khẩu.</p>
          {error && <div className="error-box">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoFocus
            />
          </div>
          <button className="btn" disabled={loading}>{loading ? "Đang gửi..." : "Gửi mã OTP"}</button>
          <div className="auth-toggle">
            <button type="button" onClick={() => { setStep("auth"); setError(""); }}>← Quay lại đăng nhập</button>
          </div>
        </form>
      </div>
    );
  }

  // ── Step: Nhập OTP + mật khẩu mới ───────────────────────────────────────────
  if (step === "reset") {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleReset}>
          <h1><HiOutlineLockClosed /> Đặt lại mật khẩu</h1>
          <p className="auth-subtitle">
            Mã OTP đã gửi tới <strong>{email}</strong>. Nhập mã và mật khẩu mới của bạn.
          </p>
          {error && <div className="error-box">{error}</div>}
          <div className="form-group">
            <label className="form-label">Mã OTP</label>
            <input
              className="form-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập 6 chữ số"
              maxLength={6}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <input
              className="form-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <button className="btn" disabled={loading}>{loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}</button>
          <div className="auth-toggle">
            <button type="button" onClick={() => { setStep("forgot"); setError(""); }}>← Gửi lại mã OTP</button>
          </div>
        </form>
      </div>
    );
  }

  // ── Step: Đăng nhập / Đăng ký ───────────────────────────────────────────────
  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleAuth}>
        <h1>
          <img src="https://res.cloudinary.com/dpigoorhc/image/upload/v1775490823/Logo_ihg1b0.png" alt="Logo" style={{ height: 64, verticalAlign: "middle" }} />
        </h1>
        <p className="auth-subtitle">
          {isRegister ? "Tạo tài khoản để mua nông sản tươi" : "Đăng nhập để tiếp tục mua sắm"}
        </p>
        {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
        {isRegister && (
          <div className="form-group">
            <label className="form-label"><HiOutlineUser style={{ verticalAlign: "middle" }} /> Họ tên</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label"><HiOutlineEnvelope style={{ verticalAlign: "middle" }} /> Email</label>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label"><HiOutlineLockClosed style={{ verticalAlign: "middle" }} /> Mật khẩu</label>
          <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" />
        </div>
        {!isRegister && (
          <div style={{ textAlign: "right", marginTop: -8, marginBottom: 8 }}>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#2e7d32", cursor: "pointer", fontSize: 13, padding: 0 }}
              onClick={() => { setStep("forgot"); setError(""); }}
            >
              Quên mật khẩu?
            </button>
          </div>
        )}
        <button className="btn" disabled={loading}>
          {loading ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
        <div className="auth-toggle">
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <button type="button" onClick={() => { setIsRegister((v) => !v); setError(""); }}>
            {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
          </button>
        </div>
        <Link to="/" className="auth-home">← Về trang chủ</Link>
      </form>
    </div>
  );
}
