# UI_SPEC - Natural Store

## Design system da implement

- Primary: `#2E7D32`, hover `#256B2A`, secondary `#F9A825`.
- Background `#F7F8FA`, surface `#FFFFFF`, text main `#1F2937`, muted `#6B7280`.
- Font stack: `Inter, system-ui, sans-serif`.
- Radius: `10px` cho card/input/button.
- Shadow card + popup da ap dung trong `styles.css`.

## Layout

- Public: sticky header + search/nav, footer thong tin, chat widget goc phai.
- Admin: sidebar ben trai, main content ben phai, table co horizontal scroll tren man hinh hep.
- Mobile-first voi breakpoint chinh tai `@media (max-width: 991px)`.

## Route frontend

- `/` Home
- `/shop` Shop listing + filter
- `/products/:id` Product detail + batch info
- `/login` Login/Register/OTP verify
- `/cart` Cart
- `/checkout` Checkout
- `/wishlist` Wishlist
- `/orders/:id` Order detail
- `/admin` Dashboard
- `/admin/products`
- `/admin/batches`
- `/admin/orders`
- `/admin/contacts`

## Screenshot checklist (chup tay)

- Home desktop + mobile
- Shop co bo loc
- Product detail co thong tin lo
- Cart + Checkout validate
- Login/Register + OTP verify
- Admin dashboard KPI
- Admin table (products/batches/orders/contacts)
- Chat widget closed/open + goi y AI

## TODO UI

- **P1**: Skeleton/empty/error states day du cho tat ca trang admin.
- **P1**: Toast/confirm dialog dong bo cho destructive actions.
- **P2**: Mega menu desktop + mobile drawer category.
- **P2**: Chart visual cho dashboard/reports.
- **P3**: i18n vi/en switcher va a11y audit chuyen sau.

