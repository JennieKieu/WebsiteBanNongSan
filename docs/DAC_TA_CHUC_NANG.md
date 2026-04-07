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
| PU-02 | Danh sách sản phẩm (shop) | Xem, lọc theo danh mục / từ khóa; **sắp xếp** theo `newest`, `price_asc`, `price_desc`; **ẩn sản phẩm hết hàng** (tồn kho = 0 hoặc chưa có lô hàng) khỏi kết quả trả về | Khách | `/shop` | `GET /products?category=&q=&sort=&page=&limit=`, `GET /categories` |
| PU-03 | Chi tiết sản phẩm | Thông tin đầy đủ: ảnh, mô tả, giá, giá KM, nhà cung cấp, chứng nhận, tồn kho; nếu hết hàng hiển thị badge "Hết hàng"; nếu đã thêm tối đa số tồn vào giỏ hiển thị badge "Đã thêm tối đa"; **spinner số lượng tối đa = availableStock − số lượng đã có trong giỏ** | Khách / KH | `/products/:id` | `GET /products/:id`, `GET /cart` (lấy cartQty) |
| PU-04 | Banner công khai | Chỉ đọc banner đang hoạt động | Khách | (nhúng trên Home) | `GET /banners` |
| PU-05 | Danh mục công khai | Danh mục hoạt động | Khách | Home, Shop | `GET /categories` |
| PU-06 | Mã giảm giá đang hiệu lực | Liệt kê coupon `isActive`, trong khung thời gian, `usedCount < usageLimit`; **lọc thêm theo `perUserLimit`** nếu user đã đăng nhập — ẩn những mã user đã dùng đủ số lần | Khách / KH | (Cart) | `GET /coupons/active` (optionalAuth) |
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
| AU-03 | Đăng nhập | Email + mật khẩu; chỉ cho phép nếu đã verified; trả access token (15 phút) + refresh token (7 ngày) dạng JWT | Khách | `/login` | `POST /auth/login` |
| AU-04 | Làm mới token | Dùng refresh token để lấy access token mới | KH | (http client tự động) | `POST /auth/refresh-token` |
| AU-05 | Đăng xuất | Xóa refresh token phía server | KH | Header / Account | `POST /auth/logout` |
| AU-06 | Thông tin tôi | Lấy profile hiện tại | KH | — | `GET /users/me` |
| AU-07 | Cập nhật hồ sơ | Đổi tên, SĐT, … | KH | `/account` | `PUT /auth/profile` |
| AU-08 | Đổi mật khẩu | Xác thực mật khẩu cũ → đặt mật khẩu mới | KH | `/account` | `PUT /auth/change-password` |

---

## 4. Giỏ hàng, yêu thích & đơn hàng (khách hàng)

| Mã | Chức năng | Mô tả chi tiết | Actor | UI / Route | API liên quan |
| --- | --- | --- | --- | --- | --- |
| CA-01 | Xem giỏ hàng | Danh sách item gồm thông tin sản phẩm + `availableStock`; cảnh báo sản phẩm hết hàng; khóa nút thanh toán nếu có sản phẩm hết hàng | KH | `/cart` | `GET /cart` |
| CA-02 | Thêm / cập nhật số lượng | Upsert item; **số lượng mỗi lần thêm tối đa = availableStock − cartQty** (hiện tại trong giỏ); gửi tổng `cartQty + qty` lên server | KH | Cart, Product detail | `POST /cart/items` |
| CA-03 | Xóa một dòng giỏ | Xóa theo `productId` | KH | `/cart` | `DELETE /cart/items/:productId` |
| CA-04 | Xóa toàn bộ giỏ | Làm rỗng giỏ | KH | `/cart` | `DELETE /cart/clear` |
| CA-05 | Áp dụng mã giảm giá | Chọn từ danh sách hoặc nhập tay; kiểm tra giá trị đơn tối thiểu; hiển thị số tiền được giảm; chỉ hiển thị những mã user còn lượt dùng | KH | `/cart` | `GET /coupons/active` |
| WI-01 | Xem wishlist | Danh sách sản phẩm yêu thích | KH | `/wishlist` | `GET /wishlist` |
| WI-02 | Thêm wishlist | Thêm `productId` | KH | Product card / detail | `POST /wishlist/items` |
| WI-03 | Xóa wishlist | Xóa theo `productId` | KH | `/wishlist` | `DELETE /wishlist/items/:productId` |
| OR-01 | Đặt hàng (đã đăng nhập) | Lấy item từ giỏ; phân bổ tồn theo **FEFO** từ lô; hỗ trợ mã giảm giá; phí ship 20.000đ nếu subtotal ≤ 300.000đ | KH | `/checkout` | `POST /checkout/place-order` |
| OR-02 | Danh sách đơn của tôi | Lịch sử đơn hàng theo user | KH | `/account` | `GET /orders/my-orders` |
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
| AD-02 | Báo cáo chi tiết | Thống kê theo khoảng thời gian (doanh thu, đơn, v.v.) | Admin | `/admin/reports` | `GET /admin/reports` |
| AD-03 | Lô sắp hết hạn (danh sách) | Xem batch near expiry | Admin | (dùng chung resource) | `GET /admin/near-expiry` |
| AD-04 | Trigger kiểm tra hết hạn | Gọi kiểm tra và tạo thông báo liên quan batch | Admin / Cron | — | `POST /admin/check-expiry-notifications` |
| AD-05 | Upload ảnh | Upload lên Cloudinary, folder query `folder` | Admin | Form upload admin | `POST /admin/upload` |
| AD-06 | Xóa ảnh Cloudinary | Xóa theo `public_id` | Admin | — | `POST /admin/delete-image` |

---

## 7. Quản trị — CRUD tài nguyên

Tất cả route dưới đây yêu cầu JWT + role `Admin`. Lỗi trùng lặp, vi phạm ràng buộc được thông báo qua **toast** (`react-hot-toast`) phía client.

| Mã | Module | Chức năng | Mô tả chi tiết | UI Route |
| --- | --- | --- | --- | --- |
| AM-01 | Banner | CRUD banner | Tiêu đề (**duy nhất**), ảnh, link, `isActive`; thông báo lỗi toast nếu trùng tiêu đề | `/admin/banners` |
| AM-02 | Danh mục | CRUD category | Tên (**duy nhất**, không phân biệt hoa thường), slug tự sinh, `isActive`; toast lỗi nếu trùng tên | `/admin/categories` |
| AM-03 | Sản phẩm | CRUD + lọc trạng thái | Tên (**duy nhất**, không phân biệt hoa thường), slug, mô tả, danh mục, ảnh, NCC, chứng nhận, đơn vị, giá, giá KM, `isActive`; toast lỗi nếu trùng tên; **trạng thái hiển thị** tính theo `isActive` + `availableStock` (xem bảng trạng thái bên dưới) | `/admin/products` |
| AM-04 | Mã giảm giá | CRUD coupon | Mã (**duy nhất**), loại %/cố định, giá trị, min đơn, thời gian bắt đầu/kết thúc, giới hạn tổng lượt (`usageLimit`), giới hạn lượt/user (`perUserLimit`); toast lỗi nếu trùng mã | `/admin/coupons` |
| AM-05 | Đơn hàng | Xem + cập nhật trạng thái | Trạng thái: `Pending → Confirmed → Packing → Shipping → Delivered / DeliveryFailed / RetryDelivery / Cancelled` (theo `validTransitions`) | `/admin/orders` |
| AM-06 | Liên hệ | Danh sách, cập nhật, xóa | Trạng thái: `Unread`, `Read`, `Contacted`, `Resolved`, `Failed` + ghi chú nội bộ | `/admin/contacts` |

**Trạng thái sản phẩm trong Admin:**

| Trạng thái | Điều kiện | Ý nghĩa |
| --- | --- | --- |
| **Đang bán** | `isActive = true` AND `availableStock > 0` | Đang kinh doanh, còn hàng |
| **Ngừng bán** | `isActive = false` | Admin chủ động tắt |
| **Chờ nhập hàng** | `isActive = true` AND `availableStock = 0` | Chưa có lô hàng hoặc tất cả lô đã hết |

> Sản phẩm ở trạng thái **Ngừng bán** hoặc **Chờ nhập hàng** đều **bị ẩn** khỏi trang shop của khách hàng.

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
| BT-01 | Danh sách lô | Lọc theo sản phẩm, trạng thái; hiển thị mã lô, ngày HSD, tồn kho, giá nhập | `/admin/batches` | `GET /admin/batches` |
| BT-02 | Tạo lô | Mã lô (**duy nhất**, không phân biệt hoa thường); ngày thu hoạch / đóng gói / HSD; số lượng; **giá nhập / 1 sản phẩm phải nhỏ hơn giá bán**; ghi chú; modal hiển thị giá bán hiện tại để tham chiếu | `/admin/batches` | `POST /admin/batches` |
| BT-03 | Sửa lô | Cập nhật thông tin; kiểm tra lại ràng buộc giá nhập < giá bán; toast lỗi nếu vi phạm | `/admin/batches` | `PUT /admin/batches/:id` |
| BT-04 | Xóa lô | Xóa batch | `/admin/batches` | `DELETE /admin/batches/:id` |
| BT-05 | Bật/tắt lô | `isDisabled` — lô bị disabled không tham gia phân bổ tồn kho | `/admin/batches` | `PATCH /admin/batches/:id/toggle-disabled` |
| BT-06 | Trạng thái lô | `Active`, `NearExpiry`, `Expired`, `OutOfStock` — cập nhật tự động qua service | Hệ thống | (trong `inventory.service`) |

**Nghiệp vụ tồn kho:**
- Đặt hàng dùng **FEFO** (ưu tiên lô theo ngày hết hạn gần nhất).
- Hủy đơn hoàn tồn về lô gốc (`restoreInventoryForOrder`).
- Mọi biến động được ghi vào `InventoryTransaction` với type: `IMPORT`, `ALLOCATE`, `RESTORE`, `ADJUST`.
- `availableStock` của sản phẩm được **tính động** bằng aggregation từ các lô Active / NearExpiry chưa bị disabled và còn hàng (`quantityInStock > 0`, chưa hết hạn).

---

## 9. Quản trị — quản lý người dùng

| Mã | Chức năng | Mô tả chi tiết | UI | API |
| --- | --- | --- | --- | --- |
| US-01 | Danh sách người dùng | Liệt kê user role `Customer` | `/admin/customers` | `GET /admin/customers` |
| US-02 | Tạo người dùng | Tạo tài khoản customer (validator riêng: email, mật khẩu, tên) | `/admin/customers` | `POST /admin/customers` |
| US-03 | Sửa người dùng | Cập nhật thông tin (tên, SĐT, trạng thái xác thực) | `/admin/customers` | `PUT /admin/customers/:id` |
| US-04 | Xóa người dùng | Xóa tài khoản | `/admin/customers` | `DELETE /admin/customers/:id` |

---

## 10. Ràng buộc dữ liệu & nghiệp vụ

| Hạng mục | Ràng buộc |
| --- | --- |
| **Tên sản phẩm** | Duy nhất, không phân biệt hoa thường; kiểm tra trước khi tạo/sửa, trả `409` nếu trùng |
| **Tên danh mục** | Duy nhất, không phân biệt hoa thường; trả `409` nếu trùng |
| **Tiêu đề banner** | Duy nhất (không phân biệt hoa thường); trả `409` nếu trùng |
| **Mã coupon** | Duy nhất (chữ hoa); trả `409` nếu trùng |
| **Mã lô hàng** | Duy nhất (không phân biệt hoa thường); trả `409` nếu trùng |
| **Giá nhập lô** | Phải nhỏ hơn giá bán hiệu lực của sản phẩm (salePrice nếu có, ngược lại price); trả `400` nếu vi phạm |
| **Số lượng giỏ hàng** | Không vượt `availableStock`; giới hạn tối đa = `availableStock − cartQty` |
| **Mã giảm giá per-user** | Ẩn/không cho áp dụng nếu user đã dùng ≥ `perUserLimit` lần |
| **Sản phẩm hiển thị shop** | Chỉ hiển thị khi `isActive = true` AND `availableStock > 0` |

---

## 11. Phi chức năng & cấu hình

| Hạng mục | Chi tiết |
| --- | --- |
| **Bảo mật** | JWT access (15 phút) + refresh (7 ngày); route admin bảo vệ bởi `requireRole("Admin")`; rate limit chat 15 req/phút / IP |
| **Validation** | `express-validator` cho register, login, OTP, product, batch, coupon, admin customer |
| **Thông báo lỗi client** | `react-hot-toast` — hiển thị toast cho các lỗi: trùng tên SP, trùng mã lô, trùng danh mục, trùng banner, trùng coupon, giá nhập ≥ giá bán |
| **Xử lý lỗi server** | Middleware `errorHandler` bắt MongoDB E11000 → trả `409` với message tiếng Việt |
| **File** | Upload ảnh qua `multer` memory → Cloudinary |
| **Thanh toán** | `paymentMethod`: CashOnDelivery, BankTransfer, CreditCard, Ewallet — lưu trên đơn (chưa tích hợp cổng thanh toán) |
| **Guest checkout** | Điều khiển bởi biến môi trường `ALLOW_GUEST_CHECKOUT` |
| **Tìm kiếm** | Hỗ trợ tìm không dấu tiếng Việt qua các trường `*Normalized` được tự sinh bởi Mongoose middleware |

---

## 12. Trang lỗi & layout

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| UI-01 | 404 | Trang không tồn tại — fallback `*` → `NotFoundPage` |
| UI-02 | Layout cửa hàng | Header, Footer, Chat widget, scroll top — `MainLayout` |
| UI-03 | Layout admin | Sidebar menu đầy đủ module + chuông thông báo — `AdminLayout` |

---

*Tài liệu sinh từ mã nguồn; khi thêm route hoặc màn hình mới, cập nhật bảng tương ứng.*
