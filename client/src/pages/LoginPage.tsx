import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineShieldCheck } from "react-icons/hi2";
import http from "../api/http";
import { useAuthStore } from "../store/useAuthStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"auth" | "verify">("auth");
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
        return;
      }
      const res = await http.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.data.accessToken);
      localStorage.setItem("refreshToken", res.data.data.refreshToken);
      setUser(res.data.data.user);
      navigate(res.data.data.user.role === "Admin" ? "/admin" : "/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập / đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await http.post("/auth/verify-otp", { email, otp });
      toast.success("Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay.");
      setStep("auth");
      setIsRegister(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  if (step === "verify") {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleVerify}>
          <h1><HiOutlineShieldCheck /> Xác minh OTP</h1>
          <p className="auth-subtitle">
            Vui lòng nhập mã OTP 6 số đã gửi tới email <strong>{email}</strong>
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
        </form>
      </div>
    );
  }

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
