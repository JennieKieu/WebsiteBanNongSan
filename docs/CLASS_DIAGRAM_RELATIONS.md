# Chú thích quan hệ – Biểu đồ lớp thực thể

## Ký hiệu

| Ký hiệu | Loại quan hệ | Mô tả |
|---|---|---|
| `──────▷` | **Association** | Đường liền, mũi tên mở (→). Một ObjectId FK tham chiếu collection khác |
| `◆──────` | **Composition** | Kim cương **đặc** ở đầu "chứa". Sub-document nhúng vào cùng collection, không có collection riêng |
| `◇──────▷` | **Aggregation** | Kim cương **rỗng** ở đầu "chứa". Mảng `[ObjectId]` tham chiếu sang collection khác |

> **Quy tắc đặt diamond**: Diamond luôn nằm ở phía class "chứa" (Whole), đầu còn lại là class "bị chứa" (Part).

---

## Danh sách quan hệ

### 1. Nhóm User & Xác thực

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 1 | **User** | `──────▷` | **OtpVerification** | 1 | N | `OtpVerification.email` khớp `User.email` *(logic, không phải ObjectId FK)* |

---

### 2. Nhóm Sản phẩm & Danh mục

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 2 | **Category** | `──────▷` | **Product** | 1 | N | `Product.categoryId → Category` |
| 3 | **Product** | `◆──────` | **«embedded» Image** | 1 | 0..* | `Product.images: [imageSchema]` *(nhúng, không có collection riêng)* |
| 4 | **Banner** | `◆──────` | **«embedded» Image** | 1 | 1 | `Banner.image: imageSchema` *(nhúng)* |

---

### 3. Nhóm Kho hàng

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 5 | **Product** | `──────▷` | **ProductBatch** | 1 | N | `ProductBatch.productId → Product` |
| 6 | **ProductBatch** | `──────▷` | **InventoryTransaction** | 1 | N | `InventoryTransaction.batchId → ProductBatch` |
| 7 | **Product** | `- - - -▷` | **InventoryTransaction** | 1 | N | `InventoryTransaction.productId → Product` *(đường nét đứt — dependency)* |
| 8 | **User** | `──────▷` | **InventoryTransaction** | 1 | N | `InventoryTransaction.createdBy → User` |
| 9 | **Order** | `──────▷` | **InventoryTransaction** | 1 | N | `InventoryTransaction.orderId → Order` |

---

### 4. Nhóm Giỏ hàng & Wishlist

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 10 | **User** | `──────▷` | **Cart** | 1 | 1 | `Cart.userId → User` |
| 11 | **Cart** | `◆──────` | **«embedded» CartItem** | 1 | 0..* | `Cart.items: [cartItemSchema]` *(nhúng)* |
| 12 | **CartItem** | `──────▷` | **Product** | 0..* | 1 | `CartItem.productId → Product` *(FK đơn → Association)* |
| 13 | **User** | `──────▷` | **Wishlist** | 1 | 1 | `Wishlist.userId → User` |
| 14 | **Wishlist** | `◇──────▷` | **Product** | 0..* | 1 | `Wishlist.productIds: [ObjectId]` *(mảng FK → Aggregation)* |

---

### 5. Nhóm Đơn hàng

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 15 | **User** | `──────▷` | **Order** | 1 | N | `Order.userId → User` |
| 16 | **Order** | `◆──────` | **«embedded» ShippingAddress** | 1 | 1 | `Order.shippingAddress: addressSchema` *(nhúng)* |
| 17 | **Order** | `◆──────` | **«embedded» OrderItem** | 1 | 0..* | `Order.items: [orderItemSchema]` *(nhúng)* |
| 18 | **OrderItem** | `──────▷` | **Product** | 0..* | 1 | `OrderItem.productId → Product` *(FK đơn → Association)* |

---

### 6. Nhóm Mã giảm giá

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 19 | **Coupon** | `──────▷` | **CouponUsage** | 1 | N | `CouponUsage.couponId → Coupon` |
| 20 | **User** | `──────▷` | **CouponUsage** | 1 | N | `CouponUsage.userId → User` |
| 21 | **Order** | `──────▷` | **CouponUsage** | 1 | N | `CouponUsage.orderId → Order` |

---

### 7. Nhóm Chat & Thông báo

| # | Từ (source) | Loại | Đến (target) | Bội số (source) | Bội số (target) | FK / trường liên kết |
|---|---|---|---|---|---|---|
| 22 | **User** | `──────▷` | **ChatSession** | 1 | N | `ChatSession.userId → User` |
| 23 | **ChatSession** | `──────▷` | **ChatMessage** | 1 | N | `ChatMessage.sessionId → ChatSession` |
| 24 | **User** | `──────▷` | **Notification** | 1 | N | `Notification.userId → User` |

---

### 8. Bảng độc lập (không có quan hệ FK ra ngoài)

| Bảng | Ghi chú |
|---|---|
| **Contact** | Không có FK đến collection nào. Đứng độc lập. |
| **Banner** | Chỉ nhúng `Image` (embedded, không phải FK). |

---

## Tổng hợp các loại mũi tên sử dụng

```
Đường liền + mũi tên mở (→)         Association   — FK đơn ObjectId tham chiếu collection khác
Đường nét đứt + mũi tên mở (- -→)   Dependency    — tham chiếu phụ / không bắt buộc
Kim cương ĐẶC + đường liền (◆──)    Composition   — sub-document nhúng (không có _id riêng)
Kim cương RỖNG + mũi tên mở (◇──▷)  Aggregation   — mảng [ObjectId] tham chiếu
```

> **Lưu ý**: Diamond (◆ / ◇) luôn đặt tại class **nguồn/chứa (Whole)**.  
> Mũi tên (▷) luôn trỏ về class **đích/bị chứa (Part)**.
