import { useState } from 'react'
import api from '../api/client'
import { MessageCircle } from './icons'
import { Button } from './ui/Button'

type ChatMessage = { role: 'user' | 'assistant'; text: string; products?: { id: string; name: string; price: number; imageUrl?: string }[] }

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const { data } = await api.post<{ message: string; recommendedProducts?: { id: string; name: string; price: number; imageUrl?: string }[] }>(
        '/chatbot/chat',
        { message: userMsg },
      )
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.message,
          products: data.recommendedProducts,
        },
      ])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Xin lỗi, đã có lỗi. Vui lòng thử lại.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className="ns-chat-fab" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Mở chat tư vấn nông sản">
        <MessageCircle className="ns-chat-fab__icon" size={26} strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <div className="ns-chat-panel" role="dialog" aria-label="Chat tư vấn">
          <div className="ns-chat-panel__head">AI Tư vấn nông sản</div>
          <div className="ns-chat-panel__body">
            {messages.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Chào bạn! Bạn cần tư vấn gì? Ví dụ: trái cây giảm cân, tiểu đường, đẹp da…
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ns-chat-bubble ${msg.role === 'user' ? 'ns-chat-bubble--user' : 'ns-chat-bubble--bot'}`}
              >
                {msg.text}
                {msg.products && msg.products.length > 0 && (
                  <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {msg.products.map((p) => (
                      <a
                        key={p.id}
                        href={`/products/${p.id}`}
                        style={{
                          color: msg.role === 'user' ? '#fff' : 'var(--color-primary)',
                          textDecoration: 'underline',
                        }}
                      >
                        {p.name} — {p.price.toLocaleString('vi-VN')}đ
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading ? <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Đang xử lý…</div> : null}
          </div>
          <div className="ns-chat-panel__foot">
            <input
              className="ns-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Nhập câu hỏi…"
              aria-label="Nội dung tin nhắn"
            />
            <Button type="button" onClick={send} disabled={loading}>
              Gửi
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
