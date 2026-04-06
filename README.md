# Natural Store (Monorepo)

E-commerce nông sản gồm `server` (Express + MongoDB) và `client` (React + Vite), có JWT auth, OTP verify, quản lý lô hàng FEFO, checkout, admin dashboard và chatbot tư vấn theo dữ liệu thật trong DB.

## 1) Cây thư mục chính
```txt
.
|-- client
|   |-- src
|   |   |-- api/http.ts
|   |   |-- components/{Header,Footer,ProductCard,ChatWidget}.tsx
|   |   |-- layouts/{MainLayout,AdminLayout}.tsx
|   |   |-- pages/*.tsx
|   |   |-- store/useAuthStore.ts
|   |   `-- styles.css
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.ts
|-- server
|   |-- src
|   |   |-- config/{env,db,cloudinary}.js
|   |   |-- controllers/*.controller.js
|   |   |-- middlewares/{auth,errorHandler,validate}.js
|   |   |-- models/index.js
|   |   |-- routes/index.js
|   |   |-- services/{inventory,chatbot}.service.js
|   |   |-- validators/index.js
|   |   `-- {app,server}.js
|   |-- scripts/seed.js
|   |-- tests/core.test.js
|   |-- .env.example
|   `-- package.json
|-- UI_SPEC.md
`-- promt_master.md
```

## 2) Scripts

### Server
- `npm run dev`: chạy API dev
- `npm run start`: chạy API production mode
- `npm run seed`: seed dữ liệu mẫu
- `npm run test`: unit test tối thiểu

### Client
- `npm run dev`: chạy frontend dev
- `npm run build`: build production
- `npm run preview`: preview build

## 3) Cấu hình môi trường

### `server/.env`
Sao chép từ `server/.env.example`, bắt buộc:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- SMTP configs
- Cloudinary configs
- `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`

### `client/.env`
Sao chép từ `client/.env.example`
- `VITE_API_BASE_URL`

## 4) Chạy local từng bước
1. Cài MongoDB local và bảo đảm service đang chạy.
2. Tạo env:
   - copy `server/.env.example` -> `server/.env`
   - copy `client/.env.example` -> `client/.env`
3. Seed dữ liệu:
   - `cd server`
   - `npm run seed`
4. Chạy backend:
   - `npm run dev`
5. Chạy frontend (terminal khác):
   - `cd client`
   - `npm run dev`
6. Truy cập:
   - Frontend: `http://localhost:5173`
   - API health: `http://localhost:5000/api/v1/health`

Tài khoản seed:
- Admin: `admin@naturalstore.vn` / `Admin1234`
- Customer: `customer@naturalstore.vn` / `Customer123`

## 5) Deploy lên Render.com

Hướng dẫn chi tiết từng bước: **[DEPLOY.md](./DEPLOY.md)**. Repo có **[render.yaml](./render.yaml)** (Render Blueprint) để tạo API + static site; cần MongoDB Atlas và điền secret trên Render khi được hỏi.

## 6) Endpoint chính + sample request/response

### Auth
- `POST /api/v1/auth/register`
```json
{ "name": "Le A", "email": "lea@gmail.com", "password": "abc12345" }
```
```json
{ "message": "Register success. Verify OTP", "data": { "userId": "...", "otpPreview": "123456" } }
```

- `POST /api/v1/auth/verify-otp`
```json
{ "email": "lea@gmail.com", "otp": "123456" }
```

- `POST /api/v1/auth/login`
```json
{ "email": "customer@naturalstore.vn", "password": "Customer123" }
```

### Product
- `GET /api/v1/products?keyword=tao&originProvince=Lam%20Dong&certification=VietGAP`
- `GET /api/v1/products/:id`

### Cart/Wishlist
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
```json
{ "productId": "PRODUCT_ID", "quantity": 2 }
```
- `POST /api/v1/wishlist/items`
```json
{ "productId": "PRODUCT_ID" }
```

### Checkout/Order
- `POST /api/v1/checkout/place-order`
```json
{
  "shippingAddress": {
    "receiverName": "Le A",
    "receiverPhone": "0912345678",
    "province": "HCM",
    "district": "Quan 1",
    "ward": "Ben Nghe",
    "addressLine": "123 Nguyen Hue"
  },
  "paymentMethod": "CashOnDelivery",
  "couponCode": "FRESH10"
}
```

- `POST /api/v1/orders/:id/cancel`

### Chatbot
- `POST /api/v1/chat/session`
- `POST /api/v1/chat/message`
```json
{ "sessionId": "SESSION_ID", "message": "Toi muon rau huu co cho eat clean 1 tuan" }
```
```json
{
  "data": {
    "answer": "...",
    "recommendations": [
      {
        "productId": "...",
        "name": "Nong san 5",
        "unit": "kg",
        "price": 45000,
        "origin": "Lam Dong",
        "expiryInfo": "HSD: 2026-04-30",
        "reason": "...",
        "matchScore": 0.8
      }
    ],
    "followUpQuestions": ["..."],
    "actions": [{ "type": "add_to_cart", "label": "Them vao gio" }]
  }
}
```

### Admin
- `GET /api/v1/admin/dashboard`
- CRUD:
  - `/api/v1/admin/products`
  - `/api/v1/admin/categories`
  - `/api/v1/admin/banners`
  - `/api/v1/admin/coupons`
  - `/api/v1/admin/batches`
- `PUT /api/v1/admin/orders/:id/status`
- `GET /api/v1/admin/near-expiry`
- `GET /api/v1/admin/contacts`

## 7) Ghi chú nghiệp vụ chính đã implement
- FEFO allocation khi checkout: xuất từ batch gần hết hạn trước.
- Chặn bán batch expired/out-of-stock.
- Hủy đơn `Pending` hoàn tồn đúng batch đã allocate.
- Ghi `InventoryTransaction` cho allocate/restore/import.
- Chatbot chỉ recommend sản phẩm đang active + còn hàng + chưa hết hạn.
- RBAC `Admin`/`Customer` cho các route quản trị.

## 8) TODO theo mức ưu tiên
- **P1**:
  - Tách controller theo module nhỏ hơn và bổ sung test integration `cart -> checkout -> order`.
  - Bổ sung upload Cloudinary thực tế trong admin product/banner form.
  - Bổ sung OTP email qua SMTP thực tế (hiện có `otpPreview` để chạy local nhanh).
- **P2**:
  - Dashboard chart nâng cao + reports theo ngày/tháng.
  - Coupon invalid logging chi tiết theo lý do và analytics chatbot conversion.
- **P3**:
  - i18n vi/en hoàn chỉnh, a11y audit sâu, tối ưu SEO storefront.
