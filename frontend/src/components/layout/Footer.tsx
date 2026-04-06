import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'

export default function Footer() {
  return (
    <footer className="ns-footer">
      <Container>
        <div className="ns-footer__grid">
          <div>
            <h3 className="ns-footer__col-title">Thông tin cửa hàng</h3>
            <p className="ns-footer__text">Số ĐKKD: 0123456789</p>
            <p className="ns-footer__text">Địa chỉ: Hà Nội, Việt Nam</p>
            <p className="ns-footer__text">Email: contact@naturalstore.vn</p>
            <p className="ns-footer__text">Hotline: 1900 xxxx</p>
          </div>
          <div>
            <h3 className="ns-footer__col-title">Về chúng tôi</h3>
            <p className="ns-footer__text">
              <Link to="/about">Giới thiệu</Link>
            </p>
            <p className="ns-footer__text">
              <Link to="/contact">Liên hệ</Link>
            </p>
            <p className="ns-footer__text">
              <Link to="/news">Tin tức</Link>
            </p>
          </div>
          <div>
            <h3 className="ns-footer__col-title">Dịch vụ khách hàng</h3>
            <p className="ns-footer__text">
              <Link to="/orders">Kiểm tra đơn hàng</Link>
            </p>
            <p className="ns-footer__text">
              <Link to="/shipping">Chính sách vận chuyển</Link>
            </p>
            <p className="ns-footer__text">
              <Link to="/return">Chính sách đổi trả</Link>
            </p>
          </div>
        </div>
        <div className="ns-footer__bottom">© Bản quyền thuộc về Natural Store — Nông sản sạch cho bữa ăn gia đình.</div>
      </Container>
    </footer>
  )
}
