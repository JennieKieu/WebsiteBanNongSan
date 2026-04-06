import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineCheckBadge,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import http from "../api/http";
import { formatDateVN } from "../utils/vnDatetime";

type BatchRow = {
  _id: string;
  batchCode: string;
  expiryDate: string;
  quantityInStock: number;
  status: string;
  isDisabled?: boolean;
};

export default function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    http
      .get(`/admin/products/${id}`)
      .then((res) => {
        if (mounted) setProduct(res.data.data);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || "Không tải được sản phẩm.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="loading-spinner">Đang tải chi tiết sản phẩm...</div>;
  }

  if (error || !product) {
    return (
      <div className="stack-lg">
        <Link to="/admin/products" className="admin-detail-back">
          <HiOutlineArrowLeft /> Quay lại danh sách
        </Link>
        <div className="error-box">{error || "Không tìm thấy sản phẩm."}</div>
      </div>
    );
  }

  const gallery: { secure_url: string }[] = Array.isArray(product.images) ? product.images : [];
  const mainSrc =
    gallery[0]?.secure_url ||
    "https://placehold.co/600x600/E8F5E9/2E7D32?text=Natural+Store";
  const hasSale = product.salePrice != null && product.salePrice < product.price;
  const categoryName =
    typeof product.categoryId === "object" && product.categoryId?.name
      ? product.categoryId.name
      : "—";
  const batches: BatchRow[] = Array.isArray(product.batches) ? product.batches : [];

  return (
    <div className="stack-lg admin-product-detail">
      <div className="admin-detail-toolbar">
        <Link to="/admin/products" className="admin-detail-back">
          <HiOutlineArrowLeft /> Danh sách sản phẩm
        </Link>
        <div className="admin-detail-toolbar-actions">
          <Link
            to={`/products/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            <HiOutlineArrowTopRightOnSquare /> Xem trên cửa hàng
          </Link>
          <Link to="/admin/batches" className="btn btn-secondary btn-sm">
            Quản lý lô hàng
          </Link>
        </div>
      </div>

      <div className="admin-product-detail-grid">
        <div className="admin-product-detail-gallery">
          <img src={mainSrc} alt={product.name} className="admin-product-detail-main" />
          {gallery.length > 1 && (
            <div className="admin-product-detail-thumbs">
              {gallery.map((im, idx) => (
                <img key={`${im.secure_url}-${idx}`} src={im.secure_url} alt="" />
              ))}
            </div>
          )}
        </div>

        <div className="admin-product-detail-panel">
          <div className="admin-product-detail-panel-head">
            <h1 className="admin-product-detail-title">{product.name}</h1>
            <span
              className={`badge ${product.isActive ? "badge-green" : "badge-gray"}`}
            >
              {product.isActive ? "Đang bán" : "Ngừng bán"}
            </span>
          </div>

          <p className="text-muted admin-product-detail-meta">
            <span>Danh mục: {categoryName}</span>
            <span className="admin-product-detail-dot">·</span>
            <span className="admin-product-detail-origin">
              <HiOutlineBuildingOffice2 aria-hidden /> {product.supplier || "—"}
            </span>
          </p>

          {(product.certifications || []).length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {(product.certifications as string[]).map((c) => (
                <span key={c} className="badge badge-green">
                  <HiOutlineCheckBadge /> {c}
                </span>
              ))}
            </div>
          )}

          <div className="admin-product-detail-price-block">
            <span className="admin-product-detail-price">
              {(hasSale ? product.salePrice : product.price || 0).toLocaleString("vi-VN")}₫
            </span>
            {hasSale && (
              <span className="admin-product-detail-price-old">
                {Number(product.price).toLocaleString("vi-VN")}₫
              </span>
            )}
            <span className="text-muted"> / {product.unit}</span>
          </div>

          <p>
            <span className="text-muted">Tồn kho khả dụng:</span>{" "}
            <strong
              className={
                (product.availableStock ?? 0) > 0 ? "text-success" : "text-error"
              }
            >
              {product.availableStock ?? 0} {product.unit}
            </strong>
          </p>

          {product.description ? (
            <div className="admin-product-detail-desc">
              <h3>Mô tả</h3>
              <p>{product.description}</p>
            </div>
          ) : (
            <p className="text-muted">Chưa có mô tả.</p>
          )}
        </div>
      </div>

      <div className="admin-product-detail-batches">
        <h2 className="admin-product-detail-batches-title">
          <HiOutlineCalendarDays /> Lô hàng ({batches.length})
        </h2>
        {batches.length === 0 ? (
          <p className="text-muted">Chưa có lô nào.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã lô</th>
                  <th>HSD</th>
                  <th>Tồn</th>
                  <th>Trạng thái</th>
                  <th>Vô hiệu</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id}>
                    <td>{b.batchCode}</td>
                    <td>{formatDateVN(b.expiryDate)}</td>
                    <td>{b.quantityInStock}</td>
                    <td>
                      <span
                        className={
                          b.status === "Active"
                            ? "badge badge-green"
                            : b.status === "NearExpiry"
                              ? "badge badge-orange"
                              : "badge badge-red"
                        }
                      >
                        {b.status === "Active"
                          ? "Còn hạn"
                          : b.status === "NearExpiry"
                            ? "Sắp hết hạn"
                            : b.status}
                      </span>
                    </td>
                    <td>{b.isDisabled ? "Có" : "Không"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
