import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'

export default function RegisterPage() {
  const { register, sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      const err = await sendOtp(form.email, 'Register')
      if (err) setError(err)
      else setStep('otp')
    } catch {
      setError('Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const err = await verifyOtp(form.email, otp, 'Register')
      if (err) setError(err)
      else {
        alert('Xác thực thành công! Vui lòng đăng nhập.')
        navigate('/login')
      }
    } catch {
      setError('Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <Container>
        <div className="ns-page--auth ns-page--narrow">
          <div className="ns-auth-card">
            <h1 className="ns-auth-card__title">Xác thực OTP</h1>
            <p style={{ textAlign: 'center', marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
              Mã OTP đã gửi đến {form.email}
            </p>
            <form onSubmit={handleVerify}>
              <div className="ns-field">
                <label className="ns-label" htmlFor="reg-otp">
                  Mã OTP
                </label>
                <input
                  id="reg-otp"
                  className="ns-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              {error ? <p className="ns-error">{error}</p> : null}
              <Button type="submit" disabled={loading} block>
                {loading ? 'Đang xử lý…' : 'Xác thực'}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="ns-page--auth ns-page--narrow">
        <div className="ns-auth-card">
          <h1 className="ns-auth-card__title">Đăng ký</h1>
          <form onSubmit={handleRegister}>
            <div className="ns-field">
              <label className="ns-label" htmlFor="reg-last">
                Họ
              </label>
              <input
                id="reg-last"
                className="ns-input"
                placeholder="Họ"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
            <div className="ns-field">
              <label className="ns-label" htmlFor="reg-first">
                Tên
              </label>
              <input
                id="reg-first"
                className="ns-input"
                placeholder="Tên"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="ns-field">
              <label className="ns-label" htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                className="ns-input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="ns-field">
              <label className="ns-label" htmlFor="reg-phone">
                Số điện thoại
              </label>
              <input
                id="reg-phone"
                className="ns-input"
                type="tel"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div className="ns-field">
              <label className="ns-label" htmlFor="reg-pw">
                Mật khẩu
              </label>
              <input
                id="reg-pw"
                className="ns-input"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            {error ? <p className="ns-error">{error}</p> : null}
            <Button type="submit" disabled={loading} block>
              {loading ? 'Đang xử lý…' : 'Đăng ký'}
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', marginBottom: 0 }}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </Container>
  )
}
