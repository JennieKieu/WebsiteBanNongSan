# Đặc tả chức năng — Natural Store (Website bán nông sản)

Tài liệu mô tả chức năng theo mã nguồn hiện tại (`client/` + `server/`). API gốc: `/api/v1` (tiền tố có thể cấu hình qua biến môi trường).

---

## 1. Tổng quan actor

| Actor | Mô tả |
| --- | --- |
| **Khách** | Truy cập công khai, chưa đăng nhập |
| **Khách hàng** | Đã đăng nhập, role `Customer` |
| **Quản trị viên** | Role `Admin`, truy cập `/admin` |
| **Hệ thống** | Job nền / trigger API (thông báo, cập nhật trạng thái lô) |

---

## 2. Cửa hàng & nội dung công khai

| Mã | Chức năng | Mô tả chi tiết | Actor | UI / Route | API liên quan |
| --- | --- | --- | --- | --- | --- |
| PU-01 | Trang chủ | Hiển thị banner (carousel), hero, danh mục, sản phẩm nổi bật (giới hạn 8 SP) | Khách | `/` | `GET /banners`, `GET /categories`, `GET /products?limit=8` |
| PU-02 | Danh sách sản phẩm (shop) | Xem sản phẩm, lọc theo danh mục / từ khóa / sắp xếp (theo triển khai `ShopPage`) | Khách | `/shop` | `GET /products`, `GET /categories` |
| PU-03 | Chi tiết sản phẩm | Thông tin SP: ảnh, mô tả, giá, nhà cung cấp, chứng nhận, tồn kho hiển thị nếu API trả về | Khách | `/products/:id` | `GET /products/:id` |
| PU-04 | Banner công khai | Chỉ đọc banner đang hoạt động | Khách | (nhúng trên Home) | `GET /banners` |
| PU-05 | Danh mục công khai | Danh mục hoạt động | Khách | Home, Shop | `GET /categories` |
| PU-06 | Mã giảm giá đang hiệu lực | Liệt kê coupon active, trong khung thời gian, còn lượt | Khách | (Checkout / UI hiển thị) | `GET /coupons/active` |
| PU-07 | Liên hệ / góp ý | Gửi form: tên, email, chủ đề, nội dung; lưu trạng thái `Unread` | Khách | `/contact` | `POST /contact` |
| PU-08 | Chat tư vấn (AI) | Tạo phiên chat, gửi tin nhắn (giới hạn tốc độ), xem lịch sử, gửi feedback | Khách / KH | Widget `ChatWidget` | `POST /chat/session`, `POST /chat/message`, `GET /chat/history/:sessionId`, `POST /chat/feedback` |
| PU-09 | Đặt hàng khách (guest) | Đặt hàng không cần JWT nếu bật `ALLOW_GUEST_CHECKOUT`; nhập `guestInfo` + địa chỉ | Khách | `/checkout` | `POST /checkout/place-order` (optionalAuth) |
| PU-10 | Health check | Kiểm tra API sống | Hệ thống / Dev | — | `GET /health` |

---

## 3. Xác thực & tài khoản khách hàng

| Mã | Chức năng | Mô tả chi tiết | Actor | UI / Route | API liên quan |
| --- | --- | --- | --- | --- | --- |
| AU-01 | Đăng ký | Tạo tài khoản Customer, hash mật khẩu, tạo OTP xác thực email (hết hạn ~10 phút) | Khách | `/login` (flow đăng ký) | `POST /auth/register` |
| AU-02 | Xác thực OTP email | Sau khi đăng ký, xác nhận OTP để `isVerified = true` | Khách | `/login` | `POST /auth/verify-otp` |
| AU-03 | Đăng nhập | Email + mật khẩu; chỉ cho phép nếu đã verified; trả access + refresh JWT | Khách | `/login` | `POST /auth/login` |
| AU-04 | Làm mới token | Dùng refresh token để lấy access mới | KH | (http client) | `POST /auth/refresh-token` |
| AU-05 | Đăng xuất | Xóa refresh token phía server (cần JWT) | KH | Header / Account | `POST /auth/logout` |
| AU-06 | Thông tin tôi | Lấy profile hiện tại | KH | — | `GET /users/me` |
| AU-07 | Cập nhật hồ sơ | Đổi tên, SĐT, … (theo body controller) | KH | `/account` | `PUT /auth/profile` |
| AU-08 | Đổi mật khẩu | Xác thực mật khẩu cũ → đặt mật khẩu mới | KH | `/account` | `PUT /auth/change-password` |

---

## 4. Giỏ hàng, yêu thích & đơn hàng (khách hàng)

| Mã | Chức năng | Mô tả chi tiết | Actor | UI / Route | API liên quan |
| --- | --- | --- | --- | --- | --- |
| CA-01 | Xem giỏ hàng | Danh sách item (productId, số lượng) | KH | `/cart` | `GET /cart` |
| CA-02 | Thêm / cập nhật số lượng | Upsert item trong giỏ | KH | Cart, Product detail | `POST /cart/items` |
| CA-03 | Xóa một dòng giỏ | Xóa theo `productId` | KH | `/cart` | `DELETE /cart/items/:productId` |
| CA-04 | Xóa toàn bộ giỏ | Làm rỗng giỏ | KH | `/cart` | `DELETE /cart/clear` |
| WI-01 | Xem wishlist | Danh sách sản phẩm yêu thích | KH | `/wishlist` | `GET /wishlist` |
| WI-02 | Thêm wishlist | Thêm `productId` | KH | Product card / detail | `POST /wishlist/items` |
| WI-03 | Xóa wishlist | Xóa theo `productId` | KH | `/wishlist` | `DELETE /wishlist/items/:productId` |
| OR-01 | Đặt hàng (đã đăng nhập) | Lấy item từ giỏ nếu không gửi `items`; phân bổ tồn theo FEFO từ lô; hỗ trợ mã giảm giá; phí ship 20.000đ nếu subtotal ≤ 300.000đ | KH | `/checkout` | `POST /checkout/place-order` |
| OR-02 | Danh sách đơn của tôi | Lịch sử đơn hàng | KH | `/account` hoặc luồng đơn | `GET /orders/my-orders` |
| OR-03 | Chi tiết đơn | Xem một đơn theo id (chỉ của user) | KH | `/orders/:id` | `GET /orders/:id` |
| OR-04 | Hủy đơn | Chuyển trạng thái hủy theo luật server; hoàn tồn nếu có | KH | Order detail | `POST /orders/:id/cancel` |

---

## 5. Thông báo in-app

| Mã | Chức năng | Mô tả chi tiết | Actor | UI | API liên quan |
| --- | --- | --- | --- | --- | --- |
| NT-01 | Danh sách thông báo | Phân trang / danh sách theo user | KH / Admin | `NotificationBell` | `GET /notifications` |
| NT-02 | Đánh dấu đã đọc | Một thông báo | KH / Admin | Bell | `PATCH /notifications/:id/read` |
| NT-03 | Đánh dấu đọc tất cả | Toàn bộ của user | KH / Admin | Bell | `PATCH /notifications/read-all` |
| NT-04 | Loại thông báo (hệ thống) | `ORDER_STATUS`, `NEW_ORDER`, `BATCH_NEAR_EXPIRY`, `BATCH_EXPIRED`, `COUPON_NEAR_EXPIRY`, `COUPON_EXPIRED`, `NEW_CONTACT` | Hệ thống | — | (tạo qua `notification.service`) |

---

## 6. Quản trị — tổng quan & báo cáo

| Mã | Chức năng | Mô tả chi tiết | Actor | UI | API |
| --- | --- | --- | --- | --- | --- |
| AD-01 | Dashboard | Doanh thu (đơn Delivered), tổng đơn, tỷ lệ hủy, số lô gần hết hạn, liên hệ chưa xử lý, top sản phẩm bán chạy; đồng bộ refresh trạng thái lô + gợi ý thông báo coupon/batch | Admin | `/admin` | `GET /admin/dashboard` |
| AD-02 | Báo cáo chi tiết | Thống kê theo khoảng thời gian (doanh thu, đơn, v.v. — theo `adminReports`) | Admin | `/admin/reports` | `GET /admin/reports` |
| AD-03 | Lô sắp hết hạn (danh sách) | Xem batch near expiry | Admin | (có thể dùng chung resource) | `GET /admin/near-expiry` |
| AD-04 | Trigger kiểm tra hết hạn | Gọi kiểm tra và tạo thông báo liên quan batch | Admin / Cron | — | `POST /admin/check-expiry-notifications` |
| AD-05 | Upload ảnh | Upload lên Cloudinary, folder query `folder` | Admin | Form upload admin | `POST /admin/upload` |
| AD-06 | Xóa ảnh Cloudinary | Xóa theo `public_id` | Admin | — | `POST /admin/delete-image` |

---

## 7. Quản trị — CRUD tài nguyên

Tất cả route dưới đây yêu cầu JWT + role `Admin`. Một phần dùng factory `adminCrudFactory`: `GET` list, `GET/:id` (nếu có route riêng), `POST`, `PUT/:id`, `DELETE/:id`.

| Mã | Module | Chức năng | Mô tả chi tiết | UI Route |
| --- | --- | --- | --- | --- |
| AM-01 | Banner | CRUD banner | Tiêu đề, ảnh, link, `isActive` | `/admin/banners` |
| AM-02 | Danh mục | CRUD category | Tên, slug, `isActive` | `/admin/categories` |
| AM-03 | Sản phẩm | CRUD + chi tiết | Tên, slug, mô tả, danh mục, ảnh, NCC, chứng nhận, đơn vị, giá, giá KM, `isActive` | `/admin/products`, `/admin/products/:id` |
| AM-04 | Mã giảm giá | CRUD coupon | Validate: loại %/cố định, giá trị, min đơn, thời gian, giới hạn dùng, giới hạn/user | `/admin/coupons` |
| AM-05 | Đơn hàng | Xem danh sách + cập nhật trạng thái | Trạng thái: Pending → Confirmed → Packing → Shipping → Delivered / DeliveryFailed / RetryDelivery / Cancelled (theo `validTransitions`) | `/admin/orders` |
| AM-06 | Liên hệ | Danh sách, cập nhật, xóa | Trạng thái: Unread, Read, Contacted, Resolved, Failed + ghi chú nội bộ | `/admin/contacts` |

**API tham chiếu nhanh**

- Banner: `GET|POST /admin/banners`, `PUT|DELETE /admin/banners/:id`
- Category: `GET|POST /admin/categories`, `PUT|DELETE /admin/categories/:id`
- Product: `GET /admin/products`, `GET /admin/products/:id`, `POST /admin/products`, `PUT|DELETE /admin/products/:id`
- Coupon: `GET|POST /admin/coupons`, `PUT|DELETE /admin/coupons/:id`
- Order: `GET /admin/orders`, `PUT /admin/orders/:id/status`
- Contact: `GET /admin/contacts`, `PUT /admin/contacts/:id`, `DELETE /admin/contacts/:id`

---

## 8. Quản trị — lô hàng (batch) & tồn kho

| Mã | Chức năng | Mô tả chi tiết | UI | API |
| --- | --- | --- | --- | --- |
| BT-01 | Danh sách lô | Theo sản phẩm / filter (theo UI `AdminResourcePage`) | `/admin/batches` | `GET /admin/batches` |
| BT-02 | Tạo lô | Mã lô unique, ngày thu hoạch/đóng gói/HSD, số lượng, giá nhập, ghi chú | `/admin/batches` | `POST /admin/batches` |
| BT-03 | Sửa lô | Cập nhật thông tin lô | `/admin/batches` | `PUT /admin/batches/:id` |
| BT-04 | Xóa lô | Xóa batch | `/admin/batches` | `DELETE /admin/batches/:id` |
| BT-05 | Bật/tắt lô | `isDisabled` — không dùng cho phân bổ nếu disabled | `/admin/batches` | `PATCH /admin/batches/:id/toggle-disabled` |
| BT-06 | Trạng thái lô | `Active`, `NearExpiry`, `Expired`, `OutOfStock` — cập nhật qua service tồn kho | Hệ thống | (trong `inventory.service` / dashboard refresh) |

**Nghiệp vụ tồn kho:** Đặt hàng dùng **FEFO** (ưu tiên lô theo hạn sử dụng); hủy đơn có thể **hoàn tồn** (`restoreInventoryForOrder`). Giao dịch tồn ghi `InventoryTransaction` (IMPORT, ALLOCATE, RESTORE, ADJUST).

---

## 9. Quản trị — khách hàng (người dùng)

| Mã | Chức năng | Mô tả chi tiết | UI | API |
| --- | --- | --- | --- | --- |
| US-01 | Danh sách khách | Liệt kê user (Customer) | `/admin/customers` | `GET /admin/customers` |
| US-02 | Tạo khách | Tạo tài khoản customer (validator riêng) | `/admin/customers` | `POST /admin/customers` |
| US-03 | Sửa khách | Cập nhật thông tin | `/admin/customers` | `PUT /admin/customers/:id` |
| US-04 | Xóa khách | Xóa user | `/admin/customers` | `DELETE /admin/customers/:id` |

---

## 10. Ràng buộc & phi chức năng (tóm tắt)

| Hạng mục | Chi tiết |
| --- | --- |
| Bảo mật | JWT access + refresh; route admin `requireRole("Admin")`; rate limit chat 15 req/phút / IP |
| Validation | express-validator ở `validators/index.js` cho register, login, OTP, product, batch, coupon, admin customer |
| File | Upload ảnh qua `multer` memory → Cloudinary |
| Thanh toán | `paymentMethod`: CashOnDelivery, BankTransfer, CreditCard, Ewallet — lưu trên đơn (không tích hợp cổng thanh toán trong spec này) |
| Guest checkout | Điều khiển bởi biến môi trường `ALLOW_GUEST_CHECKOUT` |

---

## 11. Trang lỗi & layout

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| UI-01 | 404 | Trang không tồn tại | `/` fallback `*` → `NotFoundPage` |
| UI-02 | Layout cửa hàng | Header, Footer, Chat widget, scroll top | `MainLayout` |
| UI-03 | Layout admin | Sidebar menu đầy đủ module + chuông thông báo | `AdminLayout` |

---

*Tài liệu sinh từ mã nguồn; khi thêm route hoặc màn hình mới, cập nhật bảng tương ứng.*
