import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../../../api/client'
import { decodeJwtPayload, userFromJwtPayload } from '../jwtUser'

type User = { id: string; email: string; name: string; role: string }

type AuthContextType = {
  user: User | null
  token: string | null
  authReady: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (data: RegisterData) => Promise<string | null>
  sendOtp: (email: string, type: string) => Promise<string | null>
  verifyOtp: (email: string, otp: string, type: string) => Promise<string | null>
  forgotPassword: (email: string) => Promise<string | null>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<string | null>
  logout: () => void
  isAdmin: boolean
}

type RegisterData = { firstName: string; lastName: string; email: string; phone: string; password: string }

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const raw = localStorage.getItem('user')
    try {
      if (!t && !raw) {
        setAuthReady(true)
        return
      }

      // Ưu tiên đọc từ JWT để tránh dữ liệu user localStorage bị thiếu/hỏng khi refresh.
      if (t) {
        const parsed = userFromJwtPayload(decodeJwtPayload(t))
        localStorage.setItem('user', JSON.stringify(parsed))
        setUser(parsed)
        setToken(t)
      } else if (raw) {
        const parsed = JSON.parse(raw) as User
        setUser(parsed)
      }
    } catch {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      setUser(null)
      setToken(null)
    } finally {
      setAuthReady(true)
    }
  }, [])

  const saveAuth = (t: string, u: User) => {
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ token: string }>('/auth/login', { email, password })
    if (!data.token) return 'Đăng nhập thất bại'
    try {
      const payload = decodeJwtPayload(data.token)
      const u: User = userFromJwtPayload(payload)
      saveAuth(data.token, u)
      return null
    } catch {
      return 'Không đọc được thông tin đăng nhập. Vui lòng thử lại.'
    }
  }

  const register = async (d: RegisterData) => {
    const { data } = await api.post<{ message?: string }>('/auth/register', d)
    return null
  }

  const sendOtp = async (email: string, type: string) => {
    const { data } = await api.post<{ error?: string }>('/auth/send-otp', { email, type })
    if (data.error) return data.error
    return null
  }

  const verifyOtp = async (email: string, otp: string, type: string) => {
    const { data } = await api.post<{ error?: string }>('/auth/verify-otp', { email, otp, type })
    if (data.error) return data.error
    return null
  }

  const forgotPassword = async (email: string) => {
    const { data } = await api.post<{ error?: string }>('/auth/forgot-password', { email })
    if (data.error) return data.error
    return null
  }

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const { data } = await api.post<{ error?: string }>('/auth/reset-password', { email, otp, newPassword })
    if (data.error) return data.error
    return null
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authReady,
        login,
        register,
        sendOtp,
        verifyOtp,
        forgotPassword,
        resetPassword,
        logout,
        isAdmin: user?.role === 'Admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
