# Deploy Natural Store lên Render.com (A–Z)

Repo đã có [`render.yaml`](render.yaml) (Render Blueprint) và [`.gitignore`](.gitignore) để deploy an toàn.

---

## Cách nhanh: Blueprint (khuyến nghị)

1. Đẩy code lên GitHub (xem mục **Git** bên dưới).
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Chọn repository → Render đọc `render.yaml` và tạo 2 service:
   - `naturalstore-api` — API Node.js
   - `naturalstore` — static site (React)
4. Khi được hỏi, điền các biến **Secret** (sync: false):
   - `MONGODB_URI` — connection string MongoDB Atlas (xem mục Atlas)
   - `CLOUDINARY_*`, `AI_API_KEY`, `BREVO_*` / `MAILJET_*` / `RESEND_API_KEY` (gửi mail) hoặc SMTP
5. Đợi deploy xong. URL mặc định:
   - API: `https://naturalstore-api.onrender.com`
   - Web: `https://naturalstore.onrender.com`
6. Kiểm tra: `https://naturalstore-api.onrender.com/api/v1/health` → `{"ok":true,...}`
7. Mở `https://naturalstore.onrender.com` và thử đăng ký / mua hàng.

**Đổi tên service trên Render?** URL `.onrender.com` sẽ đổi. Khi đó sửa trong Dashboard:

- Static site: `VITE_API_BASE_URL` = `https://<ten-api-cua-ban>.onrender.com/api/v1` → **Clear build cache & deploy**
- API: `CLIENT_URL` = `https://<ten-web-cua-ban>.onrender.com` → Save

---

## Git & GitHub

```bash
cd WebsiteBanNongSan
# Nếu chưa có repo: git init && git add . && git commit -m "Initial commit" && git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

Không commit file `.env` (đã có trong `.gitignore`).

---

## MongoDB Atlas (database cloud)

1. [Đăng ký Atlas](https://www.mongodb.com/cloud/atlas/register).
2. **Create cluster** → **M0 Free** → region gần VN (Singapore / Hong Kong).
3. **Database Access** → tạo user (username + password; password tránh ký tự `@ #` trong URI nếu không biết encode).
4. **Network Access** → **Add IP** → `0.0.0.0/0` (cho Render free tier).
5. **Connect** → Driver → copy URI, thay password, thêm tên DB trước `?`, ví dụ:
   `...mongodb.net/NaturalStore?retryWrites=true&w=majority`

Dán vào biến `MONGODB_URI` trên Render.

---

## Gửi email OTP — chọn 1 trong các cách

Trên Render, SMTP tới Gmail thường bị **timeout**. Ưu tiên dùng **HTTP API**.  
Code tự chọn theo thứ tự: **Brevo → Mailjet → Resend → SMTP** (chỉ cần cấu hình **một** nhà cung cấp; nếu có nhiều biến, thứ tự trên quyết định).

---

### Cách 1 — Brevo (không cần domain)

1. Đăng ký [brevo.com](https://brevo.com) (miễn phí ~300 email/ngày).
2. **My Account → SMTP & API → API Keys** → tạo key.
3. **Senders & IP → Senders** → thêm Gmail của bạn → xác minh qua link email.
4. Trên Render (service API) → **Environment**:
   - `BREVO_API_KEY` = key vừa tạo
   - `BREVO_SENDER_EMAIL` = Gmail đã xác minh
   - `BREVO_SENDER_NAME` = `Natural Store`
5. **Save** → deploy lại API.

---

### Cách 2 — Mailjet (Free — không bắt buộc domain)

1. Đăng ký [mailjet.com](https://www.mailjet.com/) → chọn **Free** (giới hạn theo gói hiện tại, thường vài nghìn email/tháng).
2. **Account settings → REST API → Master API Key** (hoặc **API Key Management**) → tạo / xem **API Key** và **Secret Key** (hai chuỗi riêng).
3. **Senders & Domains** → **Add a sender address** → nhập Gmail → xác minh qua email Mailjet gửi tới hộp thư đó.
4. Trên Render → **Environment** (service API):
   - `MAILJET_API_KEY` = API Key
   - `MAILJET_SECRET_KEY` = Secret Key
   - `MAILJET_SENDER_EMAIL` = đúng Gmail đã xác minh ở bước 3
   - `MAILJET_SENDER_NAME` = `Natural Store` (tùy chọn)
5. **Không** đặt `BREVO_*` nếu bạn muốn ưu tiên Mailjet (hoặc xóa Brevo để tránh Brevo được chọn trước).
6. **Save** → deploy lại API.

---

### Cách 3 — Resend (cần domain riêng để gửi email bất kỳ ổn định)

1. Đăng ký [resend.com](https://resend.com) → **API Keys** → tạo key dạng `re_...`.
2. Xác minh domain riêng → **Domains** → thêm domain → cấu hình DNS.
3. Trên Render → Environment: `RESEND_API_KEY`, `EMAIL_FROM`.

---

### Cách 4 — SMTP Gmail (thường timeout trên Render free tier)

| Biến | Giá trị |
|------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail gửi mail |
| `SMTP_PASS` | Mật ứng dụng 16 ký tự (Google → 2FA → Mật ứng dụng) |

---

## Seed dữ liệu mẫu (tùy chọn)

**Cách 1 — local:** Trong `server/.env` đặt `MONGODB_URI` trỏ Atlas, chạy `npm run seed` trong thư mục `server`.

**Cách 2 — Render Shell:** Web service `naturalstore-api` → **Shell** → `node scripts/seed.js`

---

## Tạo tay từng service (không dùng Blueprint)

### Web Service (API)

- **Root Directory:** `server`
- **Build:** `npm install`
- **Start:** `node src/server.js`
- **Health check path:** `/api/v1/health`
- Biến môi trường: giống `server/.env.example` + `NODE_ENV=production`. **Không** cần set `PORT` (Render tự gán).
- `CLIENT_URL` = URL frontend (vd `https://naturalstore.onrender.com`).

### Static Site (client)

- **Root Directory:** `client`
- **Build:** `npm install && npm run build`
- **Publish directory:** `dist` (hoặc trong UI đôi khi chỉ cần `dist` nếu root đã là `client` — kiểm tra log build).
- **Environment:** `VITE_API_BASE_URL=https://<api>.onrender.com/api/v1`
- **Redirect/Rewrites:** `/*` → `/index.html` (Rewrite) để React Router không 404 khi F5.

---

## Kiểm tra sau khi lên mạng

- [ ] `/api/v1/health` OK
- [ ] Trang chủ, danh sách sản phẩm, chi tiết sản phẩm
- [ ] Đăng ký / đăng nhập / giỏ hàng / đặt hàng
- [ ] Upload ảnh admin (Cloudinary)
- [ ] Chat AI (OpenAI + key)
- [ ] CORS: nếu lỗi CORS, kiểm tra `CLIENT_URL` trùng **đúng** URL trình duyệt (có `https`, không slash thừa)

---

## Lưu ý free tier

- Web service free **ngủ** sau ~15 phút không có traffic; lần đầu mở lại có thể mất ~30–60 giây.
- Static site phục vụ qua CDN, thường nhanh hơn.

---

## Domain riêng

Render → service → **Settings** → **Custom Domains** → làm theo hướng dẫn DNS (thường là CNAME). Sau đó cập nhật `CLIENT_URL` và rebuild client nếu API URL đổi.
