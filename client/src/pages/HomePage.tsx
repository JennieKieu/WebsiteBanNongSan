import { Link } from "react-router-dom";
import { HiOutlineShoppingBag, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import {
  RiLeafLine,
  RiPlantLine,
  RiSeedlingLine,
} from "react-icons/ri";
import { GiGrapes, GiWheat, GiMushroomGills, GiHerbsBundle } from "react-icons/gi";
import { useApi } from "../hooks/useApi";
import ProductCard from "../components/ProductCard";
import BannerSlider from "../components/BannerSlider";

type Product = {
  _id: string;
  name: string;
  supplier: string;
  certifications: string[];
  unit: string;
  price: number;
  salePrice?: number | null;
  availableStock?: number;
  images?: { secure_url: string }[];
};

const categoryIcons: Record<string, React.ReactNode> = {
  rau: <RiSeedlingLine />,
  qua: <GiGrapes />,
  "ngu-coc": <GiWheat />,
  "dac-san": <RiLeafLine />,
  cu: <GiMushroomGills />,
  "gia-vi": <GiHerbsBundle />,
};

export default function HomePage() {
  const { data: banners } = useApi<any[]>("/banners", []);
  const { data: products, loading } = useApi<Product[]>("/products?limit=8", []);
  const { data: categories } = useApi<any[]>("/categories", []);

  return (
    <div className="stack-lg">
      {/* Banner carousel — đặt đầu trang, tự lướt ngang */}
      {(banners || []).length > 0 && (
        <BannerSlider banners={banners!} />
      )}

      {/* Hero */}
      <section className="hero">
        <RiLeafLine style={{ fontSize: "2.5rem", marginBottom: 8 }} />
        <h1>Nông sản tươi cho mọi gia đình</h1>
        <p>Truy xuất nguồn gốc rõ ràng, tư vấn AI thông minh, giao hàng nhanh mỗi ngày.</p>
        <Link className="btn" to="/shop">
          <HiOutlineShoppingBag /> Mua sắm ngay
        </Link>
      </section>

      {/* Danh mục sản phẩm */}
      {(categories || []).length > 0 && (
        <section>
          <div className="section-title">
            <h2>Danh mục sản phẩm</h2>
            <Link to="/shop">Xem tất cả →</Link>
          </div>
          <div className="category-grid">
            {(categories || []).map((cat: any) => (
              <Link
                key={cat._id}
                to={`/shop?categoryId=${cat._id}`}
                className="category-card"
              >
                <span className="category-card-icon">
                  {categoryIcons[cat.slug] || <RiPlantLine />}
                </span>
                <span className="category-card-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sản phẩm bán chạy */}
      <section>
        <div className="section-title">
          <h2>Sản phẩm bán chạy</h2>
          <Link to="/shop">Xem tất cả →</Link>
        </div>
        {loading ? (
          <div className="loading-spinner">Đang tải sản phẩm...</div>
        ) : (
          <div className="products-grid">
            {(products || []).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Chatbot teaser */}
      <section
        className="card"
        style={{ textAlign: "center", padding: "32px 20px" }}
      >
        <HiOutlineChatBubbleLeftRight style={{ fontSize: "2.5rem", color: "var(--c-primary)" }} />
        <h3 style={{ marginTop: 12 }}>Bạn chưa biết chọn gì?</h3>
        <p className="text-muted" style={{ maxWidth: 400, margin: "8px auto 16px" }}>
          Hãy để trợ lý AI tư vấn nông sản phù hợp với nhu cầu gia đình bạn — chỉ cần nhấn nút chat góc phải!
        </p>
        <Link to="/shop" className="btn btn-outline">
          <RiLeafLine /> Khám phá cửa hàng
        </Link>
      </section>
    </div>
  );
}
