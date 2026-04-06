import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineInboxStack,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineNoSymbol,
  HiOutlinePrinter,
} from "react-icons/hi2";
import http from "../api/http";
import { useApi } from "../hooks/useApi";
import ImageUploadMulti from "../components/ImageUploadMulti";
import Pagination from "../components/Pagination";
import AdminListToolbar from "../components/AdminListToolbar";
import OrderDetailPopup, { printInvoice } from "../components/OrderDetailPopup";
import { formatDateTimeVN, formatDateVN } from "../utils/vnDatetime";
import VnIntegerInput from "../components/VnIntegerInput";

const mapPath: Record<string, string> = {
  "/admin/products": "/admin/products",
  "/admin/batches": "/admin/batches",
  "/admin/orders": "/admin/orders",
  "/admin/contacts": "/admin/contacts",
  "/admin/customers": "/admin/customers",
  "/admin/coupons": "/admin/coupons",
};

const mapTitle: Record<string, string> = {
  "/admin/products": "Quản lý sản phẩm",
  "/admin/batches": "Quản lý lô hàng",
  "/admin/orders": "Quản lý đơn hàng",
  "/admin/contacts": "Quản lý liên hệ",
  "/admin/customers": "Quản lý khách hàng",
  "/admin/coupons": "Quản lý mã giảm giá",
};

const ORDER_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Packing", "Cancelled"],
  Packing: ["Shipping"],
  Shipping: ["Delivered", "DeliveryFailed"],
  DeliveryFailed: ["RetryDelivery", "Cancelled"],
  RetryDelivery: ["Shipping", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ALL_STATUS_LABELS: Record<string, string> = {
  // Đơn hàng
  Pending: "Mới đặt",
  Confirmed: "Đã xác nhận",
  Packing: "Đang đóng gói",
  Shipping: "Đang giao",
  Delivered: "Đã giao thành công",
  DeliveryFailed: "Giao thất bại",
  RetryDelivery: "Giao lại",
  Cancelled: "Đã hủy",
  // Lô hàng
  Active: "Đang hoạt động",
  NearExpiry: "Sắp hết hạn",
  Expired: "Hết hạn",
  OutOfStock: "Hết hàng",
  // Liên hệ
  Unread: "Chưa đọc",
  Read: "Đã đọc",
  Contacted: "Đã liên hệ",
  Resolved: "Đã giải quyết",
  Failed: "Thất bại",
  // Vai trò
  Customer: "Khách hàng",
  Admin: "Quản trị viên",
};

function statusBadge(status: string) {
  if (!status || status === "—") return <span className="badge badge-gray">—</span>;
  const colorMap: Record<string, string> = {
    Active: "badge-green",
    Pending: "badge-orange",
    Confirmed: "badge-blue",
    Packing: "badge-blue",
    Shipping: "badge-blue",
    Delivered: "badge-green",
    Cancelled: "badge-red",
    NearExpiry: "badge-orange",
    Expired: "badge-red",
    Unread: "badge-orange",
    Read: "badge-gray",
    Contacted: "badge-blue",
    Resolved: "badge-green",
    Failed: "badge-red",
    OutOfStock: "badge-red",
    DeliveryFailed: "badge-orange",
    RetryDelivery: "badge-orange",
    Customer: "badge-green",
    Admin: "badge-blue",
  };
  const label = ALL_STATUS_LABELS[status] || status;
  return <span className={`badge ${colorMap[status] || "badge-gray"}`}>{label}</span>;
}

type Category = { _id: string; name: string };
type ProductRow = {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
  images?: { secure_url: string; public_id?: string }[];
  supplier: string;
  certifications?: string[];
  unit: string;
  price: number;
  salePrice?: number | null;
  isActive?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

type BatchRow = {
  _id: string;
  productId: string;
  batchCode: string;
  harvestDate: string;
  packingDate: string;
  expiryDate: string;
  quantityInStock: number;
  importPrice: number;
  status: string;
  isDisabled?: boolean;
  hasOrders?: boolean;
  notes?: string;
  updatedAt?: string;
};

type CouponRow = {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  startAt: string;
  endAt: string;
  usageLimit: number;
  perUserLimit: number;
  usedCount?: number;
  isActive?: boolean;
  updatedAt?: string;
};

type ContactRow = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  internalNotes?: string;
  updatedAt?: string;
};

type OrderRow = {
  _id: string;
  orderCode: string;
  status: string;
  total: number;
  createdAt: string;
};

type CustomerRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isVerified?: boolean;
};

export default function AdminResourcePage() {
  const location = useLocation();
  const path = location.pathname;
  const endpoint = mapPath[path] || "/admin/products";
  const title = mapTitle[path] || "Quản trị";

  const [tick, setTick] = useState(0);
  const { data, loading, error } = useApi<any[]>(endpoint, [endpoint, tick]);
  const { data: categories } = useApi<Category[]>("/categories", []);
  const { data: productsForBatches } = useApi<ProductRow[]>(
    path === "/admin/batches" ? "/admin/products" : null,
    [tick, path]
  );
  const productList =
    path === "/admin/products" ? ((data || []) as ProductRow[]) : productsForBatches || [];

  const catMap = useMemo(
    () => Object.fromEntries((categories || []).map((c) => [c._id, c.name])),
    [categories]
  );

  const reload = () => { setTick((t) => t + 1); setPage(1); };

  const [errMsg, setErrMsg] = useState("");
  const [page, setPage] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterBatchDisabled, setFilterBatchDisabled] = useState("");
  const [filterRole, setFilterRole] = useState("");

  useEffect(() => {
    setListSearch("");
    setFilterCategoryId("");
    setFilterStatus("");
    setFilterActive("");
    setFilterBatchDisabled("");
    setFilterRole("");
    setPage(1);
  }, [path]);

  useEffect(() => {
    setPage(1);
  }, [listSearch, filterCategoryId, filterStatus, filterActive, filterBatchDisabled, filterRole]);

  /* —— Products —— */
  const [productModal, setProductModal] = useState<"create" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [pf, setPf] = useState({
    name: "",
    slug: "",
    categoryId: "",
    description: "",
    images: [] as { secure_url: string; public_id?: string }[],
    supplier: "",
    certifications: "",
    unit: "kg",
    price: "" as string | number,
    salePrice: "" as string | number,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  function openProductCreate() {
    setEditingProduct(null);
    setPf({
      name: "",
      slug: "",
      categoryId: (categories && categories[0]?._id) || "",
      description: "",
      images: [],
      supplier: "",
      certifications: "",
      unit: "kg",
      price: "",
      salePrice: "",
      isActive: true,
    });
    setProductModal("create");
  }

  function openProductEdit(p: ProductRow) {
    setEditingProduct(p);
    setPf({
      name: p.name,
      slug: p.slug,
      categoryId: String(p.categoryId),
      description: p.description || "",
      images: [...(p.images || [])],
      supplier: p.supplier || "",
      certifications: (p.certifications || []).join(", "),
      unit: p.unit,
      price: p.price,
      salePrice: p.salePrice ?? "",
      isActive: p.isActive !== false,
    });
    setProductModal("edit");
  }

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    const slug = pf.slug.trim() || toSlug(pf.name);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setErrMsg("Slug chỉ gồm chữ thường, số và dấu gạch ngang.");
      return;
    }
    const price = Number(pf.price);
    if (!pf.name.trim() || !pf.categoryId || !pf.supplier.trim() || !price || price <= 0) {
      setErrMsg("Vui lòng điền đủ tên, nhà cung cấp, danh mục và giá hợp lệ.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: pf.name.trim(),
        slug,
        categoryId: pf.categoryId,
        description: pf.description.trim(),
        supplier: pf.supplier.trim(),
        certifications: pf.certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        unit: pf.unit.trim() || "kg",
        price,
        isActive: pf.isActive,
      };
      body.images = pf.images;
      const sp = pf.salePrice === "" ? null : Number(pf.salePrice);
      if (sp != null && sp > 0) body.salePrice = sp;
      else if (productModal === "edit") body.salePrice = null;

      if (productModal === "edit" && editingProduct) {
        await http.put(`/admin/products/${editingProduct._id}`, body);
      } else {
        await http.post("/admin/products", body);
      }
      setProductModal(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Lưu sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  }

  /* —— Batches —— */
  const [batchModal, setBatchModal] = useState<"create" | "edit" | null>(null);
  const [editingBatch, setEditingBatch] = useState<BatchRow | null>(null);
  const [bf, setBf] = useState({
    productId: "",
    batchCode: "",
    harvestDate: "",
    packingDate: "",
    expiryDate: "",
    quantityInStock: "" as string | number,
    importPrice: "" as string | number,
    status: "Active",
    notes: "",
  });

  function isoForInput(d: string) {
    if (!d) return "";
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    return x.toISOString().slice(0, 16);
  }

  function openBatchCreate() {
    setEditingBatch(null);
    const now = new Date();
    const iso = now.toISOString().slice(0, 16);
    setBf({
      productId: (productList && productList[0]?._id) || "",
      batchCode: `BATCH-${Date.now().toString(36).toUpperCase()}`,
      harvestDate: iso,
      packingDate: iso,
      expiryDate: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16),
      quantityInStock: 100,
      importPrice: 0,
      status: "Active",
      notes: "",
    });
    setBatchModal("create");
  }

  function openBatchEdit(b: BatchRow) {
    setEditingBatch(b);
    setBf({
      productId: String(b.productId),
      batchCode: b.batchCode,
      harvestDate: isoForInput(b.harvestDate),
      packingDate: isoForInput(b.packingDate),
      expiryDate: isoForInput(b.expiryDate),
      quantityInStock: b.quantityInStock,
      importPrice: b.importPrice,
      status: b.status,
      notes: b.notes || "",
    });
    setBatchModal("edit");
  }

  async function submitBatch(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    setSaving(true);
    try {
      const body = {
        productId: bf.productId,
        batchCode: bf.batchCode.trim(),
        harvestDate: new Date(bf.harvestDate).toISOString(),
        packingDate: new Date(bf.packingDate).toISOString(),
        expiryDate: new Date(bf.expiryDate).toISOString(),
        quantityInStock: Number(bf.quantityInStock),
        importPrice: Number(bf.importPrice),
        status: bf.status,
        notes: bf.notes.trim(),
      };
      if (batchModal === "edit" && editingBatch) {
        await http.put(`/admin/batches/${editingBatch._id}`, body);
      } else {
        await http.post("/admin/batches", body);
      }
      setBatchModal(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Lưu lô hàng thất bại");
    } finally {
      setSaving(false);
    }
  }

  /* —— Coupons —— */
  const [couponModal, setCouponModal] = useState<"create" | "edit" | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null);
  const [cf, setCf] = useState({
    code: "",
    discountType: "PERCENT" as string,
    discountValue: "" as string | number,
    minOrderValue: "" as string | number,
    startAt: "",
    endAt: "",
    usageLimit: 100,
    perUserLimit: 2,
    isActive: true,
  });

  function openCouponCreate() {
    setEditingCoupon(null);
    const s = new Date();
    const e = new Date(s.getTime() + 30 * 86400000);
    setCf({
      code: "",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 0,
      startAt: s.toISOString().slice(0, 16),
      endAt: e.toISOString().slice(0, 16),
      usageLimit: 100,
      perUserLimit: 2,
      isActive: true,
    });
    setCouponModal("create");
  }

  function openCouponEdit(c: CouponRow) {
    setEditingCoupon(c);
    setCf({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue ?? 0,
      startAt: isoForInput(c.startAt),
      endAt: isoForInput(c.endAt),
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      isActive: c.isActive !== false,
    });
    setCouponModal("edit");
  }

  async function submitCoupon(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    setSaving(true);
    try {
      if (cf.discountType === "PERCENT" && Number(cf.discountValue) > 100) {
        setErrMsg("Giảm theo % không được vượt quá 100%");
        return;
      }
      const body = {
        code: String(cf.code).trim().toUpperCase(),
        discountType: cf.discountType,
        discountValue: Number(cf.discountValue),
        minOrderValue: Number(cf.minOrderValue) || 0,
        startAt: new Date(cf.startAt).toISOString(),
        endAt: new Date(cf.endAt).toISOString(),
        usageLimit: Number(cf.usageLimit),
        perUserLimit: Number(cf.perUserLimit),
        isActive: cf.isActive,
      };
      if (couponModal === "edit" && editingCoupon) {
        await http.put(`/admin/coupons/${editingCoupon._id}`, body);
      } else {
        await http.post("/admin/coupons", body);
      }
      setCouponModal(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Lưu mã giảm giá thất bại");
    } finally {
      setSaving(false);
    }
  }

  /* —— Customers —— */
  const [customerModal, setCustomerModal] = useState<"create" | "edit" | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [uf, setUf] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Customer",
  });

  function openCustomerCreate() {
    setEditingCustomer(null);
    setUf({ name: "", email: "", password: "", phone: "", role: "Customer" });
    setCustomerModal("create");
  }

  function openCustomerEdit(u: CustomerRow) {
    setEditingCustomer(u);
    setUf({
      name: u.name,
      email: u.email,
      password: "",
      phone: u.phone || "",
      role: u.role === "Admin" ? "Admin" : "Customer",
    });
    setCustomerModal("edit");
  }

  async function submitCustomer(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    if (!uf.name.trim() || !uf.email.trim()) {
      setErrMsg("Vui lòng nhập họ tên và email.");
      return;
    }
    if (customerModal === "create" && uf.password.length < 6) {
      setErrMsg("Mật khẩu tạo mới cần ít nhất 6 ký tự.");
      return;
    }
    if (customerModal === "edit" && uf.password && uf.password.length < 6) {
      setErrMsg("Mật khẩu mới cần ít nhất 6 ký tự (hoặc để trống).");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: uf.name.trim(),
        email: uf.email.trim(),
        phone: uf.phone.trim(),
        role: uf.role,
      };
      if (customerModal === "create") {
        body.password = uf.password;
        await http.post("/admin/customers", body);
      } else if (editingCustomer) {
        if (uf.password.trim()) body.password = uf.password.trim();
        await http.put(`/admin/customers/${editingCustomer._id}`, body);
      }
      setCustomerModal(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Lưu khách hàng thất bại");
    } finally {
      setSaving(false);
    }
  }

  /* —— Contacts —— */
  const [contactModal, setContactModal] = useState<ContactRow | null>(null);
  const [ctf, setCtf] = useState({ status: "Unread", internalNotes: "" });

  function openContactEdit(c: ContactRow) {
    setContactModal(c);
    setCtf({ status: c.status, internalNotes: c.internalNotes || "" });
  }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactModal) return;
    setSaving(true);
    setErrMsg("");
    try {
      await http.put(`/admin/contacts/${contactModal._id}`, {
        status: ctf.status,
        internalNotes: ctf.internalNotes,
      });
      setContactModal(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  }

  /* —— Order status —— */
  const [orderModal, setOrderModal] = useState<OrderRow | null>(null);
  const [nextOrderStatus, setNextOrderStatus] = useState("");
  const [orderDetailId, setOrderDetailId] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

  async function handlePrintInvoice(id: string) {
    setPrintingOrderId(id);
    try {
      const res = await http.get(`/orders/${id}`);
      printInvoice(res.data.data);
    } catch {
      alert("Không thể tải đơn hàng để in");
    } finally {
      setPrintingOrderId(null);
    }
  }

  /* —— Toggle batch disabled —— */
  async function toggleBatchDisabled(b: BatchRow) {
    setErrMsg("");
    try {
      await http.patch(`/admin/batches/${b._id}/toggle-disabled`);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Lỗi toggle vô hiệu hoá");
    }
  }

  /* —— Delete —— */
  const [deleteTarget, setDeleteTarget] = useState<{ kind: string; id: string; label: string } | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setErrMsg("");
    try {
      const ep =
        deleteTarget.kind === "product"
          ? `/admin/products/${deleteTarget.id}`
          : deleteTarget.kind === "batch"
            ? `/admin/batches/${deleteTarget.id}`
            : deleteTarget.kind === "coupon"
              ? `/admin/coupons/${deleteTarget.id}`
              : deleteTarget.kind === "contact"
                ? `/admin/contacts/${deleteTarget.id}`
                : deleteTarget.kind === "customer"
                  ? `/admin/customers/${deleteTarget.id}`
                  : "";
      if (!ep) return;
      await http.delete(ep);
      setDeleteTarget(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Xóa thất bại");
      setDeleteTarget(null);
    }
  }

  async function submitOrderStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!orderModal || !nextOrderStatus) return;
    setSaving(true);
    setErrMsg("");
    try {
      await http.put(`/admin/orders/${orderModal._id}/status`, { status: nextOrderStatus });
      setOrderModal(null);
      reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setErrMsg(ax.response?.data?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setSaving(false);
    }
  }

  const allRows = data || [];
  const PAGE_SIZE = 20;

  const filteredRows = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);

    if (path === "/admin/products") {
      let list = (allRows as ProductRow[]).slice();
      if (filterCategoryId) list = list.filter((p) => String(p.categoryId) === filterCategoryId);
      if (filterActive === "active") list = list.filter((p) => p.isActive !== false);
      if (filterActive === "inactive") list = list.filter((p) => p.isActive === false);
      if (q) {
        list = list.filter(
          (p) =>
            match(p.name) ||
            match(p.slug) ||
            match(p.supplier || "") ||
            (p.description && match(p.description))
        );
      }
      return list;
    }
    if (path === "/admin/batches") {
      const plist = productList as ProductRow[];
      let list = (allRows as BatchRow[]).slice();
      if (filterStatus) list = list.filter((b) => b.status === filterStatus);
      if (filterBatchDisabled === "yes") list = list.filter((b) => b.isDisabled);
      if (filterBatchDisabled === "no") list = list.filter((b) => !b.isDisabled);
      if (q) {
        list = list.filter((b) => {
          const pname = plist.find((x) => x._id === String(b.productId))?.name || "";
          return match(b.batchCode) || match(pname);
        });
      }
      return list;
    }
    if (path === "/admin/orders") {
      let list = (allRows as OrderRow[]).slice();
      if (filterStatus) list = list.filter((o) => o.status === filterStatus);
      if (q) {
        const digits = q.replace(/\D/g, "");
        list = list.filter((o) => {
          const code = (o.orderCode || "").toLowerCase();
          const tot = String(o.total ?? "");
          return code.includes(q) || (digits && tot.includes(digits));
        });
      }
      return list;
    }
    if (path === "/admin/customers") {
      let list = (allRows as { name: string; email: string; phone?: string; role: string }[]).slice();
      if (filterRole) list = list.filter((u) => u.role === filterRole);
      if (q) {
        list = list.filter((u) => match(u.name) || match(u.email) || match(u.phone || ""));
      }
      return list;
    }
    if (path === "/admin/coupons") {
      let list = (allRows as CouponRow[]).slice();
      if (filterActive === "active") list = list.filter((c) => c.isActive !== false);
      if (filterActive === "inactive") list = list.filter((c) => c.isActive === false);
      if (q) list = list.filter((c) => match(c.code));
      return list;
    }
    if (path === "/admin/contacts") {
      let list = (allRows as ContactRow[]).slice();
      if (filterStatus) list = list.filter((c) => c.status === filterStatus);
      if (q) {
        list = list.filter((c) => match(c.name) || match(c.email) || match(c.subject) || match(c.message || ""));
      }
      return list;
    }
    return allRows;
  }, [
    allRows,
    path,
    listSearch,
    filterCategoryId,
    filterStatus,
    filterActive,
    filterBatchDisabled,
    filterRole,
    productList,
  ]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const rows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const tp = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
    setPage((p) => (p > tp ? tp : p));
  }, [filteredRows.length]);

  function clearListFilters() {
    setListSearch("");
    setFilterCategoryId("");
    setFilterStatus("");
    setFilterActive("");
    setFilterBatchDisabled("");
    setFilterRole("");
    setPage(1);
  }

  return (
    <div className="stack-lg">
      <div className="row-between">
        <h1>{title}</h1>
        {path === "/admin/products" && (
          <button type="button" className="btn" onClick={openProductCreate}>
            <HiOutlinePlusCircle /> Thêm sản phẩm
          </button>
        )}
        {path === "/admin/batches" && (
          <button type="button" className="btn" onClick={openBatchCreate} disabled={!productList?.length}>
            <HiOutlinePlusCircle /> Thêm lô hàng
          </button>
        )}
        {path === "/admin/coupons" && (
          <button type="button" className="btn" onClick={openCouponCreate}>
            <HiOutlinePlusCircle /> Thêm mã giảm giá
          </button>
        )}
        {path === "/admin/customers" && (
          <button type="button" className="btn" onClick={openCustomerCreate}>
            <HiOutlinePlusCircle /> Thêm khách hàng
          </button>
        )}
      </div>

      {(error || errMsg) && (
        <div className="error-box">{errMsg || error}</div>
      )}

      {!loading && !error && allRows.length > 0 && (
        <AdminListToolbar
          search={listSearch}
          onSearchChange={setListSearch}
          placeholder={
            path === "/admin/products"
              ? "Tên, slug, nhà cung cấp, mô tả..."
              : path === "/admin/batches"
                ? "Mã lô, tên sản phẩm..."
                : path === "/admin/orders"
                  ? "Mã đơn, số tiền..."
                  : path === "/admin/customers"
                    ? "Tên, email, SĐT..."
                    : path === "/admin/coupons"
                      ? "Mã giảm giá..."
                      : "Tên, email, tiêu đề, nội dung..."
          }
        >
          {path === "/admin/products" && (
            <>
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="admin-filter-select"
                aria-label="Lọc danh mục"
              >
                <option value="">Tất cả danh mục</option>
                {(categories || []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="admin-filter-select"
                aria-label="Trạng thái bán"
              >
                <option value="">Trạng thái bán</option>
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </>
          )}
          {path === "/admin/batches" && (
            <>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-filter-select"
                aria-label="Trạng thái lô"
              >
                <option value="">Mọi trạng thái lô</option>
                <option value="Active">Đang hoạt động</option>
                <option value="NearExpiry">Sắp hết hạn</option>
                <option value="Expired">Hết hạn</option>
                <option value="OutOfStock">Hết hàng</option>
              </select>
              <select
                value={filterBatchDisabled}
                onChange={(e) => setFilterBatchDisabled(e.target.value)}
                className="admin-filter-select"
                aria-label="Vô hiệu hóa"
              >
                <option value="">Tất cả lô</option>
                <option value="no">Đang dùng</option>
                <option value="yes">Đã vô hiệu</option>
              </select>
            </>
          )}
          {path === "/admin/orders" && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-filter-select"
              aria-label="Trạng thái đơn"
            >
              <option value="">Mọi trạng thái</option>
              <option value="Pending">Mới đặt</option>
              <option value="Confirmed">Đã xác nhận</option>
              <option value="Packing">Đang đóng gói</option>
              <option value="Shipping">Đang giao</option>
              <option value="Delivered">Đã giao thành công</option>
              <option value="DeliveryFailed">Giao thất bại</option>
              <option value="RetryDelivery">Giao lại</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          )}
          {path === "/admin/customers" && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="admin-filter-select"
              aria-label="Vai trò"
            >
              <option value="">Mọi vai trò</option>
              <option value="Customer">Khách hàng</option>
              <option value="Admin">Quản trị viên</option>
            </select>
          )}
          {path === "/admin/coupons" && (
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="admin-filter-select"
              aria-label="Kích hoạt"
            >
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang bật</option>
              <option value="inactive">Đang tắt</option>
            </select>
          )}
          {path === "/admin/contacts" && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-filter-select"
              aria-label="Trạng thái liên hệ"
            >
              <option value="">Mọi trạng thái</option>
              <option value="Unread">Chưa đọc</option>
              <option value="Read">Đã đọc</option>
              <option value="Contacted">Đã liên hệ</option>
              <option value="Resolved">Đã giải quyết</option>
              <option value="Failed">Thất bại</option>
            </select>
          )}
        </AdminListToolbar>
      )}

      {loading && <div className="loading-spinner">Đang tải dữ liệu...</div>}

      {!loading && !error && allRows.length > 0 && filteredRows.length === 0 && (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0 }}>
            Không có dòng nào khớp bộ lọc.{" "}
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearListFilters}>
              Xóa bộ lọc
            </button>
          </p>
        </div>
      )}

      {!loading && !error && allRows.length === 0 && (
        <div className="empty-state">
          <HiOutlineInboxStack />
          <p>Chưa có dữ liệu</p>
          {path === "/admin/products" && (
            <button type="button" className="btn" onClick={openProductCreate}>
              Thêm sản phẩm đầu tiên
            </button>
          )}
          {path === "/admin/batches" && productList && productList.length > 0 && (
            <button type="button" className="btn" onClick={openBatchCreate}>
              Thêm lô hàng
            </button>
          )}
          {path === "/admin/coupons" && (
            <button type="button" className="btn" onClick={openCouponCreate}>
              Thêm mã giảm giá
            </button>
          )}
          {path === "/admin/customers" && (
            <button type="button" className="btn" onClick={openCustomerCreate}>
              Thêm khách hàng đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Products table */}
      {!loading && path === "/admin/products" && filteredRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(rows as ProductRow[]).map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link to={`/admin/products/${p._id}`} className="admin-product-name-link">
                      {p.name}
                    </Link>
                  </td>
                  <td>{catMap[String(p.categoryId)] || "—"}</td>
                  <td>
                    {p.salePrice ? (
                      <>
                        <strong style={{ color: "var(--c-primary)" }}>{p.salePrice.toLocaleString("vi-VN")} đ</strong>
                        <span className="text-muted" style={{ textDecoration: "line-through", marginLeft: 8, fontSize: "0.8125rem" }}>
                          {p.price.toLocaleString("vi-VN")}
                        </span>
                      </>
                    ) : (
                      <strong>{p.price.toLocaleString("vi-VN")} đ</strong>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${p.isActive !== false ? "badge-green" : "badge-gray"}`}>
                      {p.isActive !== false ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="btn-icon" title="Sửa" onClick={() => openProductEdit(p)}>
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Xóa"
                        style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                        onClick={() => setDeleteTarget({ kind: "product", id: p._id, label: p.name })}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Batches table */}
      {!loading && path === "/admin/batches" && filteredRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Sản phẩm</th>
                <th>Tồn</th>
                <th>HSD</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(rows as BatchRow[]).map((b) => {
                const pname = (productList as ProductRow[]).find((x) => x._id === String(b.productId))?.name || "—";
                const locked = !!b.hasOrders;
                const disabled = !!b.isDisabled;
                return (
                  <tr key={b._id} style={disabled ? { opacity: 0.55 } : undefined}>
                    <td style={{ fontWeight: 600 }}>
                      {b.batchCode}
                      {disabled && (
                        <span className="badge badge-gray" style={{ marginLeft: 8 }}>Vô hiệu</span>
                      )}
                    </td>
                    <td>{pname}</td>
                    <td>{b.quantityInStock}</td>
                    <td className="text-muted" style={{ fontSize: "0.8125rem" }}>
                      {formatDateVN(b.expiryDate)}
                    </td>
                    <td>
                      {statusBadge(b.status)}
                      {locked && (
                        <span className="badge badge-blue" style={{ marginLeft: 6 }}>
                          <HiOutlineLockClosed style={{ fontSize: "0.7rem" }} /> Có đơn
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {/* Toggle vô hiệu hoá */}
                        <button
                          type="button"
                          className="btn-icon"
                          title={disabled ? "Kích hoạt lại" : "Vô hiệu hoá"}
                          style={disabled ? { color: "var(--c-warning)", borderColor: "var(--c-warning)" } : undefined}
                          onClick={() => toggleBatchDisabled(b)}
                        >
                          {disabled ? <HiOutlineLockOpen /> : <HiOutlineNoSymbol />}
                        </button>
                        {/* Sửa — khóa nếu đã có đơn */}
                        <button
                          type="button"
                          className="btn-icon"
                          title={locked ? "Không thể sửa (đã có đơn hàng)" : "Sửa"}
                          disabled={locked}
                          style={locked ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
                          onClick={() => !locked && openBatchEdit(b)}
                        >
                          <HiOutlinePencilSquare />
                        </button>
                        {/* Xóa — khóa nếu đã có đơn */}
                        <button
                          type="button"
                          className="btn-icon"
                          title={locked ? "Không thể xoá (đã có đơn hàng)" : "Xoá"}
                          disabled={locked}
                          style={{
                            ...(locked
                              ? { opacity: 0.35, cursor: "not-allowed" }
                              : { color: "var(--c-error)", borderColor: "var(--c-error)" }),
                          }}
                          onClick={() => !locked && setDeleteTarget({ kind: "batch", id: b._id, label: b.batchCode })}
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders table */}
      {!loading && path === "/admin/orders" && filteredRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(rows as OrderRow[]).map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 600 }}>{o.orderCode}</td>
                  <td>{(o.total ?? 0).toLocaleString("vi-VN")} đ</td>
                  <td>{statusBadge(o.status)}</td>
                  <td className="text-muted" style={{ fontSize: "0.8125rem" }}>
                    {new Date(o.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Xem chi tiết"
                        onClick={() => setOrderDetailId(o._id)}
                      >
                        <HiOutlineEye />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="In hóa đơn"
                        disabled={printingOrderId === o._id}
                        onClick={() => handlePrintInvoice(o._id)}
                      >
                        <HiOutlinePrinter />
                      </button>
                      {(ORDER_TRANSITIONS[o.status] || []).length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setOrderModal(o);
                            setNextOrderStatus((ORDER_TRANSITIONS[o.status] || [])[0] || "");
                          }}
                        >
                          Đổi trạng thái
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers */}
      {!loading && path === "/admin/customers" && filteredRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Điện thoại</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(rows as CustomerRow[]).map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{statusBadge(u.role)}</td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="btn-icon" title="Sửa" onClick={() => openCustomerEdit(u)}>
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Xóa"
                        style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                        onClick={() => setDeleteTarget({ kind: "customer", id: u._id, label: `${u.name} (${u.email})` })}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupons */}
      {!loading && path === "/admin/coupons" && filteredRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại / Giá trị</th>
                <th>Đã dùng</th>
                <th>Hạn</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(rows as CouponRow[]).map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 700 }}>{c.code}</td>
                  <td>
                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString("vi-VN")} đ`}
                  </td>
                  <td>
                    {c.usedCount ?? 0} / {c.usageLimit}
                  </td>
                  <td className="text-muted" style={{ fontSize: "0.8125rem" }}>
                    {formatDateVN(c.endAt)}
                  </td>
                  <td>{statusBadge(c.isActive !== false ? "Active" : "—")}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="btn-icon" title="Sửa" onClick={() => openCouponEdit(c)}>
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Xóa"
                        style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                        onClick={() => setDeleteTarget({ kind: "coupon", id: c._id, label: c.code })}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contacts */}
      {!loading && path === "/admin/contacts" && filteredRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(rows as ContactRow[]).map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.subject}</td>
                  <td>{c.email}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td className="text-muted" style={{ fontSize: "0.8125rem" }}>
                    {formatDateTimeVN(c.updatedAt)}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="btn-icon" title="Xử lý" onClick={() => openContactEdit(c)}>
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Xóa"
                        style={{ color: "var(--c-error)", borderColor: "var(--c-error)" }}
                        onClick={() => setDeleteTarget({ kind: "contact", id: c._id, label: c.subject })}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredRows.length > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredRows.length}
          pageSize={PAGE_SIZE}
        />
      )}

      {/* Product modal */}
      {productModal && (
        <div className="modal-overlay" onClick={() => !saving && setProductModal(null)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{productModal === "edit" ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
              <button type="button" className="btn-ghost" onClick={() => setProductModal(null)} disabled={saving}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="modal-body stack" onSubmit={submitProduct}>
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input
                  value={pf.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setPf((prev) => ({
                      ...prev,
                      name,
                      slug: productModal === "create" ? toSlug(name) : prev.slug,
                    }));
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug (URL) *</label>
                <input
                  value={pf.slug}
                  onChange={(e) => setPf({ ...pf, slug: e.target.value })}
                  placeholder="ten-san-pham"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Danh mục *</label>
                <select value={pf.categoryId} onChange={(e) => setPf({ ...pf, categoryId: e.target.value })} required>
                  {(categories || []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea rows={2} value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} />
              </div>
              <ImageUploadMulti
                value={pf.images}
                onChange={(images) => setPf({ ...pf, images })}
                folder="products"
                label="Hình ảnh sản phẩm"
              />
              <div className="form-group">
                <label className="form-label">Nhà cung cấp *</label>
                <input
                  value={pf.supplier}
                  onChange={(e) => setPf({ ...pf, supplier: e.target.value })}
                  placeholder="VD: HTX Rau sạch Đà Lạt, Công ty CP…"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chứng nhận (cách nhau bởi dấu phẩy)</label>
                <input value={pf.certifications} onChange={(e) => setPf({ ...pf, certifications: e.target.value })} placeholder="VietGAP, OCOP" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Đơn vị *</label>
                  <input value={pf.unit} onChange={(e) => setPf({ ...pf, unit: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá (đ) *</label>
                  <VnIntegerInput
                    min={1}
                    value={pf.price === "" ? "" : Number(pf.price)}
                    onValueChange={(n) => setPf({ ...pf, price: n === null ? "" : n })}
                    required
                    placeholder="VD: 100.000"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Giá khuyến mãi (đ, để trống nếu không)</label>
                <VnIntegerInput
                  min={1}
                  value={
                    pf.salePrice === "" || pf.salePrice === null || pf.salePrice === undefined
                      ? ""
                      : Number(pf.salePrice)
                  }
                  onValueChange={(n) => setPf({ ...pf, salePrice: n === null ? "" : n })}
                  placeholder="VD: 89.000"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={pf.isActive} onChange={(e) => setPf({ ...pf, isActive: e.target.checked })} />
                Đang bán
              </label>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setProductModal(null)}>
                  Huỷ
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch modal */}
      {batchModal && (
        <div className="modal-overlay" onClick={() => !saving && setBatchModal(null)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{batchModal === "edit" ? "Sửa lô hàng" : "Thêm lô hàng"}</h3>
              <button type="button" className="btn-ghost" onClick={() => setBatchModal(null)} disabled={saving}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="modal-body stack" onSubmit={submitBatch}>
              <div className="form-group">
                <label className="form-label">Sản phẩm *</label>
                <select value={bf.productId} onChange={(e) => setBf({ ...bf, productId: e.target.value })} required>
                  {(productList || []).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mã lô *</label>
                <input value={bf.batchCode} onChange={(e) => setBf({ ...bf, batchCode: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Thu hoạch *</label>
                <input type="datetime-local" value={bf.harvestDate} onChange={(e) => setBf({ ...bf, harvestDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Đóng gói *</label>
                <input type="datetime-local" value={bf.packingDate} onChange={(e) => setBf({ ...bf, packingDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Hạn sử dụng *</label>
                <input type="datetime-local" value={bf.expiryDate} onChange={(e) => setBf({ ...bf, expiryDate: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tồn kho *</label>
                  <VnIntegerInput
                    min={0}
                    value={bf.quantityInStock === "" ? "" : Number(bf.quantityInStock)}
                    onValueChange={(n) => setBf({ ...bf, quantityInStock: n === null ? "" : n })}
                    required
                    placeholder="VD: 1.000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá nhập (đ) *</label>
                  <VnIntegerInput
                    min={0}
                    value={bf.importPrice === "" ? "" : Number(bf.importPrice)}
                    onValueChange={(n) => setBf({ ...bf, importPrice: n === null ? "" : n })}
                    required
                    placeholder="VD: 50.000"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select value={bf.status} onChange={(e) => setBf({ ...bf, status: e.target.value })}>
                  <option value="Active">Đang hoạt động</option>
                  <option value="NearExpiry">Sắp hết hạn</option>
                  <option value="Expired">Hết hạn</option>
                  <option value="OutOfStock">Hết hàng</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú</label>
                <textarea rows={2} value={bf.notes} onChange={(e) => setBf({ ...bf, notes: e.target.value })} />
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setBatchModal(null)}>
                  Huỷ
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon modal */}
      {couponModal && (
        <div className="modal-overlay" onClick={() => !saving && setCouponModal(null)}>
          <div className="modal-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{couponModal === "edit" ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}</h3>
              <button type="button" className="btn-ghost" onClick={() => setCouponModal(null)} disabled={saving}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="modal-body stack" onSubmit={submitCoupon}>
              <div className="form-group">
                <label className="form-label">Mã *</label>
                <input value={cf.code} onChange={(e) => setCf({ ...cf, code: e.target.value.toUpperCase() })} required disabled={couponModal === "edit"} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Loại *</label>
                  <select
                    value={cf.discountType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCf((prev) => {
                        const next = { ...prev, discountType: v };
                        if (v === "PERCENT") {
                          const dv = Number(prev.discountValue);
                          if (dv > 100) next.discountValue = 100;
                        }
                        return next;
                      });
                    }}
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá trị *</label>
                  <VnIntegerInput
                    min={1}
                    max={cf.discountType === "PERCENT" ? 100 : undefined}
                    value={typeof cf.discountValue === "number" ? cf.discountValue : Number(cf.discountValue) || ""}
                    onValueChange={(n) => {
                      if (n === null) {
                        setCf({ ...cf, discountValue: 0 });
                        return;
                      }
                      const cap = cf.discountType === "PERCENT" ? Math.min(n, 100) : n;
                      setCf({ ...cf, discountValue: cap });
                    }}
                    required
                    placeholder={cf.discountType === "PERCENT" ? "VD: 10 (tối đa 100%)" : "VD: 50.000"}
                  />
                  {cf.discountType === "PERCENT" && (
                    <small className="text-muted" style={{ display: "block", marginTop: 4 }}>
                      Tối đa 100%
                    </small>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Giá trị đơn tối thiểu (đ)</label>
                <VnIntegerInput
                  min={0}
                  value={typeof cf.minOrderValue === "number" ? cf.minOrderValue : Number(cf.minOrderValue) || ""}
                  onValueChange={(n) => setCf({ ...cf, minOrderValue: n === null ? 0 : n })}
                  placeholder="0"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Bắt đầu *</label>
                  <input type="datetime-local" value={cf.startAt} onChange={(e) => setCf({ ...cf, startAt: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kết thúc *</label>
                  <input type="datetime-local" value={cf.endAt} onChange={(e) => setCf({ ...cf, endAt: e.target.value })} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tổng lượt dùng mã *</label>
                  <VnIntegerInput
                    min={1}
                    value={cf.usageLimit}
                    onValueChange={(n) => setCf({ ...cf, usageLimit: n === null ? 0 : n })}
                    required
                  />
                  <small className="text-muted" style={{ display: "block", marginTop: 4 }}>
                    Tối đa bao nhiêu lần mã được áp dụng trên toàn shop (mọi khách cộng lại).
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">Mỗi khách tối đa *</label>
                  <VnIntegerInput
                    min={1}
                    value={cf.perUserLimit}
                    onValueChange={(n) => setCf({ ...cf, perUserLimit: n === null ? 0 : n })}
                    required
                  />
                  <small className="text-muted" style={{ display: "block", marginTop: 4 }}>
                    Một tài khoản đăng nhập được dùng mã này tối đa bấy nhiêu lần (khách vãng lai không tính).
                  </small>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={cf.isActive} onChange={(e) => setCf({ ...cf, isActive: e.target.checked })} />
                Kích hoạt
              </label>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCouponModal(null)}>
                  Huỷ
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer modal */}
      {customerModal && (
        <div className="modal-overlay" onClick={() => !saving && setCustomerModal(null)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{customerModal === "edit" ? "Sửa tài khoản" : "Thêm khách hàng"}</h3>
              <button type="button" className="btn-ghost" onClick={() => setCustomerModal(null)} disabled={saving}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="modal-body stack" onSubmit={submitCustomer}>
              <div className="form-group">
                <label className="form-label">Họ tên *</label>
                <input value={uf.name} onChange={(e) => setUf({ ...uf, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" value={uf.email} onChange={(e) => setUf({ ...uf, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{customerModal === "create" ? "Mật khẩu *" : "Mật khẩu mới"}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={uf.password}
                  onChange={(e) => setUf({ ...uf, password: e.target.value })}
                  placeholder={customerModal === "edit" ? "Để trống nếu không đổi" : "Tối thiểu 6 ký tự"}
                  required={customerModal === "create"}
                  minLength={customerModal === "create" ? 6 : undefined}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Điện thoại</label>
                <input value={uf.phone} onChange={(e) => setUf({ ...uf, phone: e.target.value })} placeholder="Tùy chọn" />
              </div>
              <div className="form-group">
                <label className="form-label">Vai trò</label>
                <select value={uf.role} onChange={(e) => setUf({ ...uf, role: e.target.value })}>
                  <option value="Customer">Khách hàng</option>
                  <option value="Admin">Quản trị viên</option>
                </select>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCustomerModal(null)}>
                  Huỷ
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactModal && (
        <div className="modal-overlay" onClick={() => !saving && setContactModal(null)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xử lý liên hệ</h3>
              <button type="button" className="btn-ghost" onClick={() => setContactModal(null)} disabled={saving}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="modal-body stack" onSubmit={submitContact}>
              <p style={{ fontSize: "0.875rem" }}>
                <strong>{contactModal.subject}</strong>
                <br />
                <span className="text-muted">{contactModal.email}</span>
              </p>
              <p style={{ fontSize: "0.8125rem", maxHeight: 100, overflow: "auto" }}>{contactModal.message}</p>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select value={ctf.status} onChange={(e) => setCtf({ ...ctf, status: e.target.value })}>
                  <option value="Unread">Chưa đọc</option>
                  <option value="Read">Đã đọc</option>
                  <option value="Contacted">Đã liên hệ</option>
                  <option value="Resolved">Đã giải quyết</option>
                  <option value="Failed">Thất bại</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú nội bộ</label>
                <textarea rows={3} value={ctf.internalNotes} onChange={(e) => setCtf({ ...ctf, internalNotes: e.target.value })} />
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setContactModal(null)}>
                  Đóng
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  <HiOutlineCheckCircle /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order status modal */}
      {orderModal && (
        <div className="modal-overlay" onClick={() => !saving && setOrderModal(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi trạng thái đơn</h3>
              <button type="button" className="btn-ghost" onClick={() => setOrderModal(null)} disabled={saving}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="modal-body stack" onSubmit={submitOrderStatus}>
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                Đơn <strong>{orderModal.orderCode}</strong> — hiện tại: {ALL_STATUS_LABELS[orderModal.status] || orderModal.status}
              </p>
              <div className="form-group">
                <label className="form-label">Trạng thái mới</label>
                <select value={nextOrderStatus} onChange={(e) => setNextOrderStatus(e.target.value)} required>
                  <option value="">— Chọn —</option>
                  {(ORDER_TRANSITIONS[orderModal.status] || []).map((s) => (
                    <option key={s} value={s}>
                      {ALL_STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setOrderModal(null)}>
                  Huỷ
                </button>
                <button type="submit" className="btn" disabled={saving || !nextOrderStatus}>
                  {saving ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order detail popup */}
      {orderDetailId && (
        <OrderDetailPopup
          orderId={orderDetailId}
          onClose={() => setOrderDetailId(null)}
          onStatusChanged={reload}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: "center", padding: "28px 20px" }}>
              <HiOutlineTrash style={{ fontSize: "2.5rem", color: "var(--c-error)", marginBottom: 12 }} />
              <h3>
                Xóa{" "}
                {deleteTarget.kind === "product"
                  ? "sản phẩm"
                  : deleteTarget.kind === "batch"
                    ? "lô hàng"
                    : deleteTarget.kind === "coupon"
                      ? "mã giảm giá"
                      : deleteTarget.kind === "contact"
                        ? "liên hệ"
                        : deleteTarget.kind === "customer"
                          ? "tài khoản"
                          : "mục"}
                ?
              </h3>
              <p className="text-muted" style={{ margin: "8px 0 20px" }}>{deleteTarget.label}</p>
              <div className="row" style={{ justifyContent: "center", gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                  Huỷ
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
