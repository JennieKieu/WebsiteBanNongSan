Bạn là Senior Fullstack Architect.
Hãy xây dựng full dự án e-commerce bán nông sản hoàn chỉnh, production-ready, dùng:

- Backend: Node.js + Express.js
- Frontend: React.js (Vite)
- Database: MongoDB + Mongoose
- Auth: JWT (access + refresh token)
- Image storage: Cloudinary

Tên dự án: Natural Store 

## 1) Mục tiêu

- Xây dựng hệ thống bán nông sản đầy đủ: public storefront + user + admin.
- Có đầy đủ nghiệp vụ đặc thù nông sản: lô hàng, hạn sử dụng, vùng trồng, chứng nhận, tồn kho theo lô.
- Có chatbot AI tư vấn chọn nông sản phù hợp nhu cầu.
- Triển khai được local end-to-end với dữ liệu mẫu.

## 2) Kiến trúc

Monorepo:

- `/server`: Express API (REST `/api/v1`)
- `/client`: React app

Backend structure:

- `routes/`, `controllers/`, `services/`, `models/`, `middlewares/`, `validators/`, `utils/`

Frontend structure:

- `pages/`, `components/`, `layouts/`, `api/`, `store/`, `hooks/`

## 3) Domain models bắt buộc (MongoDB)

Tạo models:

- User (customer/admin), Address, OtpVerification
- Category (Rau/Củ/Quả/Đặc sản/Ngũ cốc...)
- Product
- ProductBatch (lô hàng)
- InventoryTransaction
- Banner
- Cart, CartItem
- Wishlist
- Order, OrderItem
- Coupon
- Contact
- ChatSession, ChatMessage

### Product fields đặc thù nông sản

- name, slug, description
- categoryId
- images[] (Cloudinary URLs + public_id)
- originProvince (vùng trồng/xuất xứ)
- farmName (nông trại/nhà cung cấp)
- cultivationMethod (organic/VietGAP/GlobalGAP/traditional)
- certifications[] (VietGAP, OCOP, hữu cơ...)
- unit (kg, gram, bó, túi, thùng)
- price, salePrice
- ratingAvg, soldCount
- isActive

### ProductBatch fields

- productId
- batchCode
- harvestDate
- packingDate
- expiryDate
- quantityInStock
- importPrice
- status (Active/NearExpiry/Expired/OutOfStock)

### OrderItem snapshot

- productId nullable
- productName, productImage, unit, originProvince
- unitPrice, quantity, subtotal
- batchCode(optional snapshot)

Enums:

- OrderStatus: Pending, Confirmed, Packing, Shipping, Delivered, DeliveryFailed, RetryDelivery, Cancelled
- PaymentMethod: CashOnDelivery, BankTransfer, CreditCard, Ewallet
- ContactStatus: Unread, Read, Contacted, Resolved, Failed

## 4) Auth & RBAC

- Register/login/logout bằng JWT access + refresh.
- OTP email verify khi đăng ký.
- Forgot/reset password qua OTP.
- RBAC: `Admin`, `Customer`.
- Admin routes phải được bảo vệ.
- Guest vẫn mua hàng được (guest checkout) nếu cấu hình bật.

## 5) Cloudinary

- Upload ảnh sản phẩm/banner/ảnh chứng nhận.
- Lưu `public_id`, `secure_url`.
- Cho phép upload multiple images cho sản phẩm.
- Khi thay ảnh, xử lý xóa ảnh cũ (nếu cần).

## 6) Chức năng Public/User

- Trang chủ: banner, danh mục nổi bật, sản phẩm bán chạy, sản phẩm theo mùa.
- Shop: filter/sort/search/pagination.
- Filter đặc thù:
  - theo vùng trồng
  - theo chứng nhận
  - theo phương thức canh tác
  - theo mức giá
  - theo hạn sử dụng còn lại
- Product detail:
  - thông tin lô hàng, ngày thu hoạch, hạn dùng, chứng nhận, đánh giá.
- Cart/Wishlist.
- Checkout:
  - địa chỉ giao hàng, ghi chú, khung giờ nhận hàng.
- Theo dõi đơn hàng.
- Hủy đơn khi còn Pending.
- Đánh giá sản phẩm sau khi giao thành công.

## 7) Chức năng Admin

- Dashboard:
  - doanh thu, số đơn, top sản phẩm, tỷ lệ hủy, sản phẩm sắp hết hạn.
- CRUD:
  - category, product, banner, customer, coupon.
- Quản lý lô hàng:
  - nhập lô mới, cập nhật tồn kho theo lô, cảnh báo near-expiry.
- Quản lý đơn:
  - list, detail, update status theo transition rules.
- Quản lý contact.
- Báo cáo:
  - doanh thu theo ngày/tháng
  - sản phẩm bán chạy
  - thất thoát do hết hạn
  - chatbot conversion metrics.

## 8) Nghiệp vụ kho & hạn dùng (bắt buộc)

- Tồn kho quản lý theo `ProductBatch`.
- Khi đặt hàng, ưu tiên xuất theo FEFO (batch gần hết hạn xuất trước).
- Không cho bán batch expired.
- Cảnh báo admin khi batch gần hết hạn (ví dụ <= 3 ngày).
- Khi hủy đơn hợp lệ thì hoàn tồn về đúng lô (hoặc theo chiến lược nhất quán được định nghĩa rõ).
- Ghi `InventoryTransaction` cho mọi thay đổi tồn.

## 9) Coupon/khuyến mãi

- Coupon theo:
  - % hoặc số tiền cố định
  - min order value
  - thời gian hiệu lực
  - usage limit toàn cục và theo user
- Validate coupon tại checkout.
- Log lý do coupon invalid.

## 10) Chatbot AI tư vấn mua nông sản

Mục tiêu:

- Tư vấn chọn nông sản theo nhu cầu gia đình/người dùng:
  - mục đích (ăn sống, ép nước, nấu canh, eat clean...)
  - ngân sách
  - số người dùng
  - sở thích (hữu cơ, vùng trồng cụ thể, ít thuốc BVTV)
  - thời gian sử dụng (muốn để được bao lâu)

Yêu cầu:

- Multi-turn conversation.
- Hỏi làm rõ khi thiếu thông tin.
- Chỉ gợi ý sản phẩm có thật trong DB, còn hàng, chưa hết hạn.
- Trả về tối đa N sản phẩm + lý do phù hợp.
- Có action nhanh: xem chi tiết / thêm giỏ / lưu wishlist.
- Guest chat được, user chat cá nhân hóa theo lịch sử mua.

Chatbot APIs:

- POST `/api/v1/chat/session`
- POST `/api/v1/chat/message`
- GET `/api/v1/chat/history/:sessionId`
- POST `/api/v1/chat/feedback`

Structured chatbot response:

- `answer`
- `recommendations[]` (productId, name, unit, price, origin, expiryInfo, reason, matchScore)
- `followUpQuestions[]`
- `actions[]`

Guardrails:

- Không bịa sản phẩm.
- Không gợi ý sản phẩm expired/out-of-stock.
- Nếu không có hàng phù hợp, đề xuất nới điều kiện.

## 11) API chính (tối thiểu)

- Auth: register, verify-otp, resend-otp, login, refresh-token, logout
- User: me/profile/address management
- Product: list/detail/search/filter
- Cart: add/update/remove/clear
- Wishlist: add/remove/list
- Checkout: place-order
- Order: my-orders/detail/cancel
- Contact: create
- Admin: product/category/banner/customer/coupon CRUD
- Admin batch/inventory management
- Admin order/contact/report endpoints
- Chatbot endpoints

## 12) Frontend UX yêu cầu

- Responsive mobile-first.
- Header có search + category nav + cart badge.
- Product card hiển thị origin/certification/unit.
- Product detail có thông tin lô/hạn dùng.
- Checkout UX rõ phí ship/tổng tiền.
- Admin dashboard trực quan chart.
- Chat widget nổi góc phải toàn site.

## 13) Security & quality

- Helmet, CORS, rate limiter, input validation (zod/joi/express-validator).
- Sanitize input chống injection.
- Logging tập trung.
- Error handler chuẩn JSON.
- Không hardcode secrets.

Env bắt buộc:

- MONGODB_URI
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- SMTP configs
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- AI_PROVIDER, AI_API_KEY, AI_MODEL

## 14) Seed data

- Tạo seed:
  - 1 admin account
  - 20+ sản phẩm nông sản
  - nhiều category
  - nhiều batch với harvest/expiry khác nhau
  - orders mẫu
  - banners/coupons mẫu

## 15) Testing tối thiểu

Backend:

- Unit test: auth, FEFO allocation, order transition, coupon validation.
- Integration test: cart->checkout->order flow.

Frontend:

- Smoke test: login, filter product, add cart, checkout, admin update order, chatbot recommend.

## 16) Acceptance criteria

1. User đăng ký OTP và login thành công.
2. Lọc sản phẩm theo vùng trồng/chứng nhận hoạt động.
3. Checkout trừ tồn theo batch FEFO.
4. Không bán sản phẩm expired.
5. Hủy đơn Pending hoàn tồn đúng.
6. Admin thấy cảnh báo hàng near-expiry.
7. Upload ảnh Cloudinary hoạt động.
8. Chatbot tư vấn đúng dữ liệu thật, không bịa.
9. RBAC chặn đúng admin APIs.
10. Dự án chạy local hoàn chỉnh với hướng dẫn rõ ràng.

## 17) Output format bắt buộc từ bạn

- Sinh toàn bộ code `server` + `client`.
- In cây thư mục.
- Cung cấp `.env.example` cho cả 2 phần.
- Cung cấp scripts: dev, build, seed, test.
- Liệt kê endpoint chính + sample request/response.
- Viết hướng dẫn chạy local từng bước.
- Nêu TODO nếu có theo P1/P2/P3.
Bắt đầu triển khai ngay, không hỏi lại nếu không thiếu thông tin bắt buộc.

## 18) UI/UX SPEC ADD-ON (BẮT BUỘC TRIỂN KHAI CHI TIẾT)

### 18.1 Design system

- Phong cách: sạch, hiện đại, thân thiện với thực phẩm/nông sản.
- Màu:
  - Primary: #2E7D32
  - Primary hover: #256B2A
  - Secondary: #F9A825
  - Success: #2E7D32
  - Warning: #ED6C02
  - Error: #D32F2F
  - Background: #F7F8FA
  - Surface: #FFFFFF
  - Text main: #1F2937
  - Text muted: #6B7280
- Typography:
  - Font: Inter (fallback system sans-serif)
  - H1 32/40, H2 24/32, H3 20/28, Body 16/24, Caption 14/20
- Radius:
  - card/input/button: 10px
- Shadow:
  - card default: 0 2px 8px rgba(0,0,0,0.06)
  - popup/dropdown: 0 6px 20px rgba(0,0,0,0.12)
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.

### 18.2 Responsive breakpoints

- Mobile: <576px
- Tablet: 576–991px
- Desktop: 992–1279px
- Wide: >=1280px
Yêu cầu:
- Mobile-first.
- Không vỡ layout ở mọi breakpoint.
- Bảng admin có horizontal scroll hợp lý trên màn nhỏ.

### 18.3 Khung layout theo vai trò

#### A) Khách hàng (public/customer)

- Header sticky:
  - logo, search bar, category dropdown, account icon, wishlist icon, cart badge.
- Mega menu category khi desktop; mobile dùng drawer menu.
- Footer:
  - thông tin cửa hàng, chính sách giao hàng/đổi trả, liên hệ, mạng xã hội.
- Chat widget AI nổi góc phải dưới trên mọi trang public.

#### B) Admin

- Sidebar trái cố định:
  - Dashboard, Products, Categories, Batches, Orders, Customers, Coupons, Contacts, Reports, Chatbot Analytics, Settings.
- Topbar:
  - breadcrumb, quick search, notification, admin avatar dropdown.
- Main content:
  - card-based + data table.
- Quy tắc:
  - Sidebar collapse được.
  - Active menu highlight rõ.
  - Permission-based menu visibility.

### 18.4 Trang khách hàng bắt buộc (chi tiết UI)

1. Home

- Hero banner + CTA “Mua ngay”.
- Section “Danh mục nổi bật”.
- Section “Nông sản theo mùa”.
- Section “Bán chạy”.
- Section “Ưu đãi hôm nay”.
- Chatbot teaser block: “Bạn chưa biết mua gì? Hỏi AI tư vấn”.

1. Shop Listing

- Cột trái filter:
  - category, giá, vùng trồng, chứng nhận, canh tác, còn hàng, hạn sử dụng.
- Thanh trên:
  - sort, tổng số kết quả, view mode.
- Grid sản phẩm 2/3/4 cột theo breakpoint.
- Product card gồm:
  - ảnh, tên, xuất xứ, chứng nhận badge, giá/sale, tồn kho, nút thêm giỏ + wishlist.
- Có: loading skeleton, empty state, error state.

1. Product Detail

- Gallery ảnh + thumbnail.
- Thông tin chính:
  - tên, giá, unit, rating, tồn kho.
  - vùng trồng, nông trại, chứng nhận, ngày thu hoạch/đóng gói/hạn dùng (nếu theo lô hiển thị lô gần nhất phù hợp).
- Quantity selector + Add to cart + Buy now.
- Tabs:
  - mô tả
  - thông tin dinh dưỡng
  - hướng dẫn bảo quản
  - đánh giá khách hàng

1. Cart

- Danh sách item dạng card/table.
- Quantity stepper, remove item, subtotal từng item.
- Coupon box.
- Order summary (subtotal/discount/shipping/total).
- CTA checkout cố định rõ ràng.
- Empty cart state có nút “Tiếp tục mua sắm”.

1. Checkout

- Form thông tin nhận hàng:
  - tên, SĐT, địa chỉ, ghi chú, khung giờ nhận.
- Payment method radio group.
- Tóm tắt đơn hàng bên phải (desktop) / dưới (mobile).
- Validate realtime + inline errors.
- Nút đặt hàng disable khi invalid.

1. Account pages

- Profile
- Address book
- Wishlist
- My orders
- Order detail + timeline trạng thái.

### 18.5 Trang admin bắt buộc (chi tiết UI)

1. Admin Dashboard

- KPI cards:
  - Doanh thu hôm nay/tháng
  - Đơn mới
  - Tỷ lệ hủy
  - Sản phẩm near-expiry
- Charts:
  - doanh thu theo thời gian
  - top sản phẩm bán chạy
  - phân bố trạng thái đơn
- Widget cảnh báo:
  - batch sắp hết hạn
  - hàng tồn thấp
  - contact chưa xử lý

1. Product Management

- Data table cột:
  - ảnh, tên, category, giá, stock, status, updatedAt, actions.
- Toolbar:
  - search, filter category/status, sort, export.
- Row actions:
  - view, edit, activate/deactivate, delete.
- Add/Edit product form:
  - upload multiple images (Cloudinary preview)
  - origin, certifications, cultivation method, unit, price/sale, status
  - validation rõ ràng.

1. Batch Management

- Table:
  - batchCode, product, harvestDate, expiryDate, stock, status.
- Màu cảnh báo:
  - NearExpiry (vàng), Expired (đỏ), Active (xanh).
- Form nhập lô:
  - quantity, importPrice, dates, notes.
- Hiển thị lịch sử inventory transactions.

1. Order Management

- Table:
  - orderCode, customer, amount, payment, status, createdAt.
- Filters:
  - status, date range, payment method.
- Order detail:
  - customer info, address, items snapshot, timeline, note.
- Status update:
  - dropdown chỉ hiện transition hợp lệ.
  - confirm modal trước khi đổi trạng thái.

1. Contact Management

- Inbox table:
  - sender, subject, status, createdAt.
- Detail panel:
  - nội dung, internal notes.
- Status tags:
  - Unread/Read/Contacted/Resolved/Failed.

1. Reports + Chatbot Analytics

- Tabs:
  - Sales
  - Inventory
  - Customer
  - Chatbot
- Chatbot metrics:
  - sessions/day
  - recommendation CTR
  - add-to-cart from chatbot
  - conversion to order.

### 18.6 Component UX standards (bắt buộc)

- Buttons: primary/secondary/ghost/danger + loading state.
- Inputs: label rõ, helper text, error text.
- Modal: title/body/actions chuẩn; ESC + click outside có kiểm soát.
- Table: sticky header, sortable columns, pagination, row hover.
- Toast: success/error/info, auto dismiss.
- Confirm dialog cho hành động destructive.
- Skeleton loaders cho danh sách/trang chi tiết.
- Empty states có minh họa + CTA.

### 18.7 Accessibility + i18n

- WCAG cơ bản:
  - contrast >= 4.5:1 cho text chính
  - keyboard navigation đầy đủ
  - focus ring rõ
  - aria-label cho icon buttons.
- Hỗ trợ ngôn ngữ:
  - mặc định tiếng Việt
  - cấu trúc sẵn sàng i18n (vi/en).

### 18.8 UI acceptance criteria (điều kiện nghiệm thu giao diện)

1. Không có trang trắng/không style.
2. Header/footer/sidebar nhất quán toàn hệ thống.
3. Mọi form có validate + thông báo lỗi rõ.
4. Mọi bảng admin có filter/search/pagination hoạt động.
5. Trạng thái loading/empty/error đều có UI riêng.
6. Responsive đạt yêu cầu ở mobile/tablet/desktop.
7. Chat widget hoạt động trên public pages.
8. Màu sắc/typography đúng design system.
9. Actions quan trọng đều có feedback (toast/dialog).
10. Admin và customer có trải nghiệm tách biệt rõ ràng.

## 19) Output UI bắt buộc từ AI khi sinh code

- Tạo file `UI_SPEC.md` tóm tắt toàn bộ quy chuẩn UI đã implement.
- Cung cấp danh sách route frontend + screenshot checklist cần chụp tay.
- Nếu có phần UI chưa hoàn thiện, ghi rõ TODO theo P1/P2/P3.

## BASIC VALIDATION CONSTRAINTS (BẮT BUỘC)

Áp dụng cho cả backend (server-side) và frontend (client-side). Backend là nguồn sự thật cuối cùng.

### 1) Quy tắc chung

- Mọi field bắt buộc không được null/undefined/empty string sau khi trim.
- Chuỗi input phải `trim()` trước validate.
- Cấm chuỗi chỉ gồm khoảng trắng.
- Giới hạn độ dài min/max cho mọi text field để tránh rác dữ liệu.
- Validate kiểu dữ liệu chặt chẽ (string/number/boolean/date/objectId).
- Không cho client ghi các field hệ thống (`createdAt`, `updatedAt`, `role`, `isVerified`, ...).
- Chuẩn hóa lỗi trả về theo format thống nhất:
  - `code`, `message`, `errors[]` (field, reason).

### 2) User/Auth

- name: required, 2-80 ký tự.
- email: required, đúng định dạng email, unique, lowercase.
- password: required, 8-64 ký tự, ít nhất 1 chữ + 1 số.
- phone: required (ở checkout/profile), đúng pattern VN cơ bản.
- otp: required, đúng 6 chữ số.
- register:
  - không cho tạo nếu thiếu name/email/password.
- login:
  - bắt buộc email + password, không tiết lộ cụ thể email hay password sai.
- không cho login nếu tài khoản chưa verify OTP (trừ khi có rule khác).

### 3) Address/Shipping

- receiverName: required, 2-80.
- receiverPhone: required, pattern phone hợp lệ.
- province/district/ward: required.
- addressLine: required, 5-255.
- note: optional, max 500.

### 4) Category

- name: required, 2-100, unique (case-insensitive).
- slug: required, unique, chỉ `[a-z0-9-]`, tự sinh từ name nếu chưa truyền.

### 5) Product

- name: required, 2-160.
- slug: required + unique.
- categoryId: required, ObjectId hợp lệ, phải tồn tại category.
- price: required, number > 0.
- salePrice: optional, nếu có thì `0 < salePrice <= price`.
- unit: required (kg/gram/bó/túi/thùng...).
- originProvince: required.
- images: tối thiểu 1 ảnh.
- isActive: boolean.
- description: optional, max 5000.
- certifications: mảng optional nhưng từng phần tử phải thuộc whitelist.

### 6) ProductBatch (lô nông sản)

- productId: required, hợp lệ, product phải tồn tại.
- batchCode: required, unique.
- harvestDate: required, date hợp lệ.
- packingDate: required, date hợp lệ, `packingDate >= harvestDate`.
- expiryDate: required, date hợp lệ, `expiryDate > packingDate`.
- quantityInStock: required, integer >= 0.
- importPrice: required, number >= 0.
- cấm tạo batch đã hết hạn tại thời điểm tạo.

### 7) Cart/Wishlist

- add cart:
  - productId required + tồn tại + đang active.
  - quantity required, integer >=1, <= giới hạn tối đa mỗi sản phẩm (vd 99).
  - không vượt tồn khả dụng.
- update cart:
  - quantity >=1, không vượt tồn.
- wishlist:
  - không cho trùng product trong cùng user.

### 8) Coupon

- code: required, uppercase, unique.
- discountType: required (`PERCENT` hoặc `FIXED`).
- discountValue: required, >0.
- nếu `PERCENT` thì <=100.
- minOrderValue: >=0.
- startAt/endAt: required, `endAt > startAt`.
- usageLimit: integer >=1.
- perUserLimit: integer >=1.

### 9) Checkout/Order

- items không được rỗng.
- mọi item phải còn hàng, chưa hết hạn.
- quantity mỗi item >=1.
- paymentMethod bắt buộc thuộc enum cho phép.
- tổng tiền phải được tính ở server, không tin client total.
- không cho place order nếu thiếu shipping info bắt buộc.
- order status update chỉ cho phép theo state transition hợp lệ.

### 10) Contact

- name: required, 2-80.
- email: required, email hợp lệ.
- subject: required, 3-160.
- message: required, 10-2000.

### 11) Chatbot

- message: required, 1-2000 ký tự.
- sessionId: required cho các request tiếp theo.
- rate limit chat endpoint.
- không trả recommendation nếu không có sản phẩm hợp lệ trong DB.

### 12) Sanitization & security input

- Escape/sanitize input text để tránh XSS injection.
- Chặn key nguy hiểm trong JSON (prototype pollution).
- Validate ObjectId trước khi query DB.
- Reject request có field ngoài schema nếu ở strict mode.

### 13) Frontend form UX bắt buộc

- Hiển thị lỗi inline theo từng field.
- Disable submit khi invalid hoặc đang submit.
- Hiển thị loading state.
- Không mất dữ liệu form khi validate fail từ server.
- Mapping lỗi server về đúng field để user sửa nhanh.

