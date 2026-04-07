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
   - `CLOUDINARY_*`, `AI_API_KEY`, SMTP (nếu dùng)
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

## Gửi email OTP (SMTP / Gmail)

Đăng ký và quên mật khẩu cần cấu hình **SMTP** trên web service API (ví dụ `naturalstore-api`):

| Biến | Giá trị thường dùng |
|------|---------------------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` (hoặc `465` nếu dùng SSL trực tiếp) |
| `SMTP_USER` | Địa chỉ Gmail dùng để gửi mail |
| `SMTP_PASS` | **Mật ứng dụng** 16 ký tự (Google Account → Bảo mật → Xác minh 2 bước → Mật ứng dụng). Có thể dán có hoặc không có dấu cách giữa các nhóm ký tự. |

Trên Render: **Environment** của API → thêm đủ bốn biến → **Save** → **Manual Deploy**. Nếu thiếu biến, API sẽ trả lỗi rõ ràng; kết nối SMTP có **giới hạn thời gian chờ** để tránh giao diện bị treo “Đang xử lý…” vô hạn.

Nếu vẫn không gửi được: mở **Logs** của API, tìm dòng `[Email]`; kiểm tra lại mật ứng dụng Gmail (không dùng mật khẩu đăng nhập thường).

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
