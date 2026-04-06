import { Link } from "react-router-dom";
import { RiMailLine, RiPhoneLine, RiFacebookCircleLine, RiMapPinLine } from "react-icons/ri";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <img src="https://res.cloudinary.com/dpigoorhc/image/upload/v1775490823/Logo_ihg1b0.png" alt="Logo" style={{ height: 102, verticalAlign: "middle" }} />
          </div>
          <p style={{ marginTop: 12 }}>
            Nông sản sạch — truy xuất rõ ràng — giao hàng nhanh chóng.
            Cam kết chất lượng từ nông trại đến bàn ăn.
          </p>
        </div>
        <div>
          <h4>Chính sách</h4>
          <p><Link to="/shop">Chính sách giao hàng</Link></p>
          <p><Link to="/shop">Chính sách đổi trả</Link></p>
          <p><Link to="/shop">Chính sách bảo mật</Link></p>
          <p><Link to="/shop">Điều khoản sử dụng</Link></p>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <p><RiMailLine style={{ verticalAlign: "middle", marginRight: 6 }} /> support@naturalstore.vn</p>
          <p><RiPhoneLine style={{ verticalAlign: "middle", marginRight: 6 }} /> 1900 1234</p>
          <p><RiMapPinLine style={{ verticalAlign: "middle", marginRight: 6 }} /> 123 Đường Nông Sản, TP.HCM</p>
          <p><RiFacebookCircleLine style={{ verticalAlign: "middle", marginRight: 6 }} /> /naturalstore.vn</p>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Natural Store. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
}
