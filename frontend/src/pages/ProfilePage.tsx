import { Container } from '../components/ui/Container'

export default function ProfilePage() {
  return (
    <Container>
      <h1 className="ns-section-head__title" style={{ marginBottom: 'var(--space-4)' }}>
        Thông tin cá nhân
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '36rem' }}>
        Trang đang được hoàn thiện. Bạn có thể cập nhật họ tên, địa chỉ và mật khẩu tại đây sau khi backend hỗ trợ đầy đủ.
      </p>
    </Container>
  )
}
