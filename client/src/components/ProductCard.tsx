import { Link } from "react-router-dom";
import { HiOutlineShoppingCart, HiOutlineBuildingOffice2, HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { RiLeafLine } from "react-icons/ri";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/useAuthStore";

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

export default function ProductCard({ product }: { product: Product }) {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const displayPrice = hasSale ? product.salePrice! : product.price;
  const inStock = Number(product.availableStock || 0) > 0;

  const user = useAuthStore((s) => s.user);
  const toggle = useWishlistStore((s) => s.toggle);
  const liked = useWishlistStore((s) => s.ids.has(product._id));

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggle(product._id);
  }

  return (
    <article className="card product-card">
      {user && (
        <button
          type="button"
          className={`wishlist-heart ${liked ? "wishlist-heart--active" : ""}`}
          onClick={handleWishlist}
          aria-label={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}
          title={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}
        >
          {liked ? <HiHeart /> : <HiOutlineHeart />}
        </button>
      )}
      <Link to={`/products/${product._id}`}>
        <img
          src={product.images?.[0]?.secure_url || "https://placehold.co/600x400/E8F5E9/2E7D32?text=Natural+Store"}
          alt={product.name}
          className="product-thumb"
          loading="lazy"
        />
      </Link>
      <div className="card-body">
        <div className="product-tags">
          {(product.certifications || []).slice(0, 2).map((c) => (
            <span className="tag" key={c}>
              <RiLeafLine style={{ fontSize: 10, verticalAlign: "middle" }} /> {c}
            </span>
          ))}
        </div>
        <Link to={`/products/${product._id}`} className="product-name">
          {product.name}
        </Link>
        <div className="product-origin">
          <HiOutlineBuildingOffice2 /> {product.supplier || "—"}
        </div>
        <div className="product-price-row">
          <span className="product-price">
            {displayPrice.toLocaleString("vi-VN")}₫
          </span>
          {hasSale && (
            <span className="product-price-old">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
          )}
          <span className="product-unit">/ {product.unit}</span>
        </div>
        <div className="product-stock">
          {inStock ? (
            <span className="badge badge-green">Còn hàng</span>
          ) : (
            <span className="badge badge-red">Hết hàng</span>
          )}
        </div>
        <div className="product-actions">
          <Link to={`/products/${product._id}`} className="btn btn-sm" style={{ flex: 1 }}>
            <HiOutlineShoppingCart /> Xem & Mua
          </Link>
        </div>
      </div>
    </article>
  );
}
