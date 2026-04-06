import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineAdjustmentsHorizontal, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { RiLeafLine } from "react-icons/ri";
import ProductCard from "../components/ProductCard";
import VnIntegerInput from "../components/VnIntegerInput";
import Pagination from "../components/Pagination";
import { useApi } from "../hooks/useApi";
import http from "../api/http";

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

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const keyword = params.get("keyword") || "";
  const categoryId = params.get("categoryId") || "";
  const supplier = params.get("supplier") || "";
  const cert = params.get("certification") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";

  const { data: categories } = useApi<Category[]>("/categories", []);

  const pageNum = Number(params.get("page") || 1);
  const PAGE_SIZE = 20;

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const q = `/products?keyword=${encodeURIComponent(keyword)}&categoryId=${categoryId}&supplier=${encodeURIComponent(supplier)}&certification=${encodeURIComponent(cert)}&minPrice=${minPrice}&maxPrice=${maxPrice}&limit=${PAGE_SIZE}&page=${pageNum}`;
    http.get(q)
      .then((res) => {
        if (!mounted) return;
        setProducts(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
        setTotalItems(res.data.pagination?.total ?? 0);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [keyword, categoryId, supplier, cert, minPrice, maxPrice, pageNum]);

  function updateFilter(key: string, value: string) {
    setParams((p) => {
      const next = { ...Object.fromEntries(p.entries()), [key]: value };
      if (key !== "page") next.page = "1";
      return next;
    });
  }

  const activeCategoryName = categories?.find((c) => c._id === categoryId)?.name;

  const filterPanel = (
    <div className="filter-card">
      <h3><HiOutlineAdjustmentsHorizontal /> Bộ lọc</h3>

      <div className="filter-section">
        <label><RiLeafLine style={{ verticalAlign: "middle" }} /> Danh mục</label>
        <select value={categoryId} onChange={(e) => updateFilter("categoryId", e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {(categories || []).map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="filter-section">
        <label>Từ khoá</label>
        <input
          value={keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          placeholder="Tên sản phẩm..."
        />
      </div>
      <div className="filter-section">
        <label>Nhà cung cấp</label>
        <input
          value={supplier}
          onChange={(e) => updateFilter("supplier", e.target.value)}
          placeholder="Tên nhà cung cấp..."
        />
      </div>
      <div className="filter-section">
        <label>Chứng nhận</label>
        <input
          value={cert}
          onChange={(e) => updateFilter("certification", e.target.value)}
          placeholder="VD: VietGAP, hữu cơ..."
        />
      </div>
      <div className="filter-section">
        <label>Giá từ</label>
        <VnIntegerInput
          value={
            minPrice === ""
              ? ""
              : Number.isFinite(Number(minPrice))
                ? Number(minPrice)
                : ""
          }
          onValueChange={(n) => updateFilter("minPrice", n === null ? "" : String(n))}
          min={0}
          placeholder="VD: 50.000"
        />
      </div>
      <div className="filter-section">
        <label>Giá đến</label>
        <VnIntegerInput
          value={
            maxPrice === ""
              ? ""
              : Number.isFinite(Number(maxPrice))
                ? Number(maxPrice)
                : ""
          }
          onValueChange={(n) => updateFilter("maxPrice", n === null ? "" : String(n))}
          min={0}
          placeholder="VD: 500.000"
        />
      </div>

      {(categoryId || supplier || cert || minPrice || maxPrice) && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => setParams({})}
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <div className="stack">
      {/* Mobile filter toggle */}
      <div className="filter-toggle-mobile">
        <button className="btn btn-outline" onClick={() => setFilterOpen(!filterOpen)}>
          <HiOutlineAdjustmentsHorizontal /> {filterOpen ? "Ẩn bộ lọc" : "Bộ lọc"}
        </button>
      </div>

      <div className="shop-layout">
        <aside className={`shop-sidebar ${filterOpen ? "open" : ""}`}>
          {filterPanel}
        </aside>

        <section className="shop-content">
          <div className="shop-toolbar">
            <h1 style={{ fontSize: "1.375rem" }}>
              <RiLeafLine style={{ verticalAlign: "middle", color: "var(--c-primary)" }} />{" "}
              {activeCategoryName || "Tất cả sản phẩm"}
            </h1>
            <span className="shop-count">
              {loading ? "Đang tải..." : `${totalItems} sản phẩm`}
            </span>
          </div>

          {error && <div className="error-box">{error}</div>}

          {!loading && !error && products.length === 0 && (
            <div className="empty-state">
              <HiOutlineMagnifyingGlass />
              <p>Không tìm thấy sản phẩm phù hợp. Hãy thử thay đổi bộ lọc.</p>
            </div>
          )}

          {loading ? (
            <div className="loading-spinner">Đang tải danh sách...</div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  page={pageNum}
                  totalPages={totalPages}
                  onPageChange={(p) => updateFilter("page", String(p))}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
