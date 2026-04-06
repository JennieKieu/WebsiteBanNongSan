import { Link } from "react-router-dom";
import { HiOutlineHome } from "react-icons/hi2";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Xin lỗi, trang bạn tìm kiếm không tồn tại.</p>
      <Link to="/" className="btn">
        <HiOutlineHome /> Về trang chủ
      </Link>
    </div>
  );
}
