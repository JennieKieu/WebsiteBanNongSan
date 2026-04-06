import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const err = await login(email, password)
      if (err) setError(err)
      else navigate('/')
    } catch {
      setError('Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <div className="ns-page--auth ns-page--narrow">
        <div className="ns-auth-card">
          <h1 className="ns-auth-card__title">Đăng nhập</h1>
          <form onSubmit={handleSubmit}>
            <div className="ns-field">
              <label className="ns-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="ns-input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="ns-field">
              <label className="ns-label" htmlFor="login-password">
                Mật khẩu
              </label>
              <input
                id="login-password"
                className="ns-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="ns-error">{error}</p> : null}
            <Button type="submit" disabled={loading} block>
              {loading ? 'Đang xử lý…' : 'Đăng nhập'}
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', marginBottom: 0 }}>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-3)', marginBottom: 0 }}>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </div>
      </div>
    </Container>
  )
}
