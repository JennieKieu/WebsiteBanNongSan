# Thiết Kế Cơ Sở Dữ Liệu

> **Hệ quản trị CSDL:** MongoDB (NoSQL)
> **ODM:** Mongoose
> **Ghi chú:** Mỗi collection đều có trường `_id` (ObjectId – khóa chính, tự sinh), `createdAt` và `updatedAt` (timestamp tự động) trừ khi có ghi chú khác.

---

## Danh sách Collection

1. [User – Người dùng](#1-user--người-dùng)
2. [Address – Địa chỉ giao hàng](#2-address--địa-chỉ-giao-hàng)
3. [OtpVerification – Xác thực OTP](#3-otpverification--xác-thực-otp)
4. [Category – Danh mục sản phẩm](#4-category--danh-mục-sản-phẩm)
5. [Product – Sản phẩm](#5-product--sản-phẩm)
6. [ProductBatch – Lô hàng](#6-productbatch--lô-hàng)
7. [InventoryTransaction – Giao dịch kho](#7-inventorytransaction--giao-dịch-kho)
8. [Banner – Banner quảng cáo](#8-banner--banner-quảng-cáo)
9. [Cart – Giỏ hàng](#9-cart--giỏ-hàng)
10. [Wishlist – Danh sách yêu thích](#10-wishlist--danh-sách-yêu-thích)
11. [Order – Đơn hàng](#11-order--đơn-hàng)
12. [Coupon – Mã giảm giá](#12-coupon--mã-giảm-giá)
13. [CouponUsage – Lịch sử dùng mã giảm giá](#13-couponusage--lịch-sử-dùng-mã-giảm-giá)
14. [Contact – Liên hệ khách hàng](#14-contact--liên-hệ-khách-hàng)
15. [ChatSession – Phiên chat tư vấn](#15-chatsession--phiên-chat-tư-vấn)
16. [ChatMessage – Tin nhắn chat](#16-chatmessage--tin-nhắn-chat)
17. [Notification – Thông báo](#17-notification--thông-báo)

---

## 1. User – Người dùng

*Bảng 1: Bảng User*


| STT | Tên cột      | Kiểu dữ liệu | Mô tả                                       |
| --- | ------------ | ------------ | ------------------------------------------- |
| 1   | _id          | ObjectId     | PK – mã người dùng (tự sinh)                |
| 2   | name         | String       | Họ tên người dùng (bắt buộc)                |
| 3   | email        | String       | Email (bắt buộc, duy nhất, chữ thường)      |
| 4   | passwordHash | String       | Mật khẩu đã mã hóa bcrypt (bắt buộc)        |
| 5   | role         | String       | Vai trò: `Admin` hoặc `Customer` (mặc định) |
| 6   | phone        | String       | Số điện thoại (tùy chọn)                    |
| 7   | isVerified   | Boolean      | Đã xác thực email chưa (mặc định: false)    |
| 8   | refreshToken | String       | JWT refresh token đang hoạt động            |
| 9   | createdAt    | Date         | Thời điểm tạo tài khoản                     |
| 10  | updatedAt    | Date         | Thời điểm cập nhật gần nhất                 |


---

## 2. Address – Địa chỉ giao hàng

*Bảng 2: Bảng Address*


| STT | Tên cột       | Kiểu dữ liệu | Mô tả                               |
| --- | ------------- | ------------ | ----------------------------------- |
| 1   | _id           | ObjectId     | PK – mã địa chỉ (tự sinh)           |
| 2   | receiverName  | String       | Tên người nhận hàng (bắt buộc)      |
| 3   | receiverPhone | String       | Số điện thoại người nhận (bắt buộc) |
| 4   | province      | String       | Tỉnh / Thành phố (bắt buộc)         |
| 5   | district      | String       | Quận / Huyện (bắt buộc)             |
| 6   | ward          | String       | Phường / Xã (bắt buộc)              |
| 7   | addressLine   | String       | Số nhà, tên đường (bắt buộc)        |
| 8   | note          | String       | Ghi chú giao hàng (tùy chọn)        |
| 9   | userId        | ObjectId     | FK – tham chiếu `User._id`          |
| 10  | createdAt     | Date         | Thời điểm tạo                       |
| 11  | updatedAt     | Date         | Thời điểm cập nhật                  |


---

## 3. OtpVerification – Xác thực OTP

*Bảng 3: Bảng OtpVerification*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                          |
| --- | --------- | ------------ | ---------------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã bản ghi (tự sinh)                      |
| 2   | email     | String       | Email nhận OTP (bắt buộc, chữ thường)          |
| 3   | otp       | String       | Mã OTP đã mã hóa (bắt buộc)                    |
| 4   | type      | String       | Loại OTP: `VERIFY_EMAIL` hoặc `RESET_PASSWORD` |
| 5   | expiresAt | Date         | Thời điểm OTP hết hạn (bắt buộc)               |
| 6   | createdAt | Date         | Thời điểm tạo                                  |
| 7   | updatedAt | Date         | Thời điểm cập nhật                             |


---

## 4. Category – Danh mục sản phẩm

*Bảng 4: Bảng Category*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                    |
| --- | --------- | ------------ | ---------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã danh mục (tự sinh)               |
| 2   | name      | String       | Tên danh mục (bắt buộc, duy nhất)        |
| 3   | slug      | String       | Slug URL (bắt buộc, duy nhất)            |
| 4   | isActive  | Boolean      | Đang hiển thị hay không (mặc định: true) |
| 5   | createdAt | Date         | Thời điểm tạo                            |
| 6   | updatedAt | Date         | Thời điểm cập nhật                       |


---

## 5. Product – Sản phẩm

*Bảng 5: Bảng Product*


| STT | Tên cột               | Kiểu dữ liệu | Mô tả                                           |
| --- | --------------------- | ------------ | ----------------------------------------------- |
| 1   | _id                   | ObjectId     | PK – mã sản phẩm (tự sinh)                      |
| 2   | name                  | String       | Tên sản phẩm (bắt buộc)                         |
| 3   | slug                  | String       | Slug URL (bắt buộc, duy nhất)                   |
| 4   | description           | String       | Mô tả sản phẩm                                  |
| 5   | categoryId            | ObjectId     | FK – tham chiếu `Category._id` (bắt buộc)       |
| 6   | images                | ArrayImage   | Danh sách ảnh (`secure_url`, `public_id`)       |
| 7   | supplier              | String       | Tên nhà cung cấp / vùng trồng (bắt buộc)        |
| 8   | certifications        | ArrayString  | Danh sách chứng nhận (VD: VietGAP, Organic)     |
| 9   | unit                  | String       | Đơn vị tính (VD: kg, hộp, bó) (bắt buộc)        |
| 10  | price                 | Number       | Giá bán niêm yết (đ) – bắt buộc, ≥ 0            |
| 11  | salePrice             | Number       | Giá khuyến mãi (đ) – tùy chọn, < price          |
| 12  | ratingAvg             | Number       | Điểm đánh giá trung bình (mặc định: 0)          |
| 13  | soldCount             | Number       | Số lượng đã bán (mặc định: 0)                   |
| 14  | isActive              | Boolean      | Đang kinh doanh hay không (mặc định: true)      |
| 15  | nameNormalized        | String       | Tên không dấu (dùng tìm kiếm, tự sinh)          |
| 16  | supplierNormalized    | String       | Nhà cung cấp không dấu (dùng tìm kiếm, tự sinh) |
| 17  | certificationsSearch  | String       | Chứng nhận không dấu (dùng tìm kiếm, tự sinh)   |
| 18  | descriptionNormalized | String       | Mô tả không dấu (dùng tìm kiếm, tự sinh)        |
| 19  | createdAt             | Date         | Thời điểm tạo                                   |
| 20  | updatedAt             | Date         | Thời điểm cập nhật                              |


---

## 6. ProductBatch – Lô hàng

*Bảng 6: Bảng ProductBatch*


| STT | Tên cột         | Kiểu dữ liệu | Mô tả                                                                          |
| --- | --------------- | ------------ | ------------------------------------------------------------------------------ |
| 1   | _id             | ObjectId     | PK – mã lô hàng (tự sinh)                                                      |
| 2   | productId       | ObjectId     | FK – tham chiếu `Product._id` (bắt buộc)                                       |
| 3   | batchCode       | String       | Mã lô hàng (bắt buộc, duy nhất)                                                |
| 4   | harvestDate     | Date         | Ngày thu hoạch (bắt buộc)                                                      |
| 5   | packingDate     | Date         | Ngày đóng gói (bắt buộc)                                                       |
| 6   | expiryDate      | Date         | Ngày hết hạn sử dụng (bắt buộc)                                                |
| 7   | quantityInStock | Number       | Số lượng tồn kho (bắt buộc, ≥ 0)                                               |
| 8   | importPrice     | Number       | Giá nhập / 1 sản phẩm (đ) – bắt buộc, ≥ 0, phải < giá bán                      |
| 9   | status          | String       | Trạng thái: `Active`, `NearExpiry`, `Expired`, `OutOfStock` (mặc định: Active) |
| 10  | isDisabled      | Boolean      | Vô hiệu hóa thủ công (mặc định: false)                                         |
| 11  | notes           | String       | Ghi chú nội bộ                                                                 |
| 12  | createdAt       | Date         | Thời điểm tạo                                                                  |
| 13  | updatedAt       | Date         | Thời điểm cập nhật                                                             |


---

## 7. InventoryTransaction – Giao dịch kho

*Bảng 7: Bảng InventoryTransaction*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                                                |
| --- | --------- | ------------ | -------------------------------------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã giao dịch (tự sinh)                                          |
| 2   | productId | ObjectId     | FK – tham chiếu `Product._id` (bắt buộc)                             |
| 3   | batchId   | ObjectId     | FK – tham chiếu `ProductBatch._id` (bắt buộc)                        |
| 4   | orderId   | ObjectId     | FK – tham chiếu `Order._id` (nếu xuất kho cho đơn hàng)              |
| 5   | type      | String       | Loại giao dịch: `IMPORT`, `ALLOCATE`, `RESTORE`, `ADJUST` (bắt buộc) |
| 6   | quantity  | Number       | Số lượng biến động (dương: nhập, âm: xuất) (bắt buộc)                |
| 7   | note      | String       | Ghi chú giao dịch                                                    |
| 8   | createdBy | ObjectId     | FK – tham chiếu `User._id` (nhân viên thực hiện)                     |
| 9   | createdAt | Date         | Thời điểm tạo                                                        |
| 10  | updatedAt | Date         | Thời điểm cập nhật                                                   |


---

## 8. Banner – Banner quảng cáo

*Bảng 8: Bảng Banner*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                    |
| --- | --------- | ------------ | ---------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã banner (tự sinh)                 |
| 2   | title     | String       | Tiêu đề banner (bắt buộc, duy nhất)      |
| 3   | image     | Image        | Ảnh banner (`secure_url`, `public_id`)   |
| 4   | link      | String       | URL đích khi click vào banner            |
| 5   | isActive  | Boolean      | Đang hiển thị hay không (mặc định: true) |
| 6   | createdAt | Date         | Thời điểm tạo                            |
| 7   | updatedAt | Date         | Thời điểm cập nhật                       |


---

## 9. Cart – Giỏ hàng

*Bảng 9: Bảng Cart*


| STT | Tên cột   | Kiểu dữ liệu  | Mô tả                                 |
| --- | --------- | ------------- | ------------------------------------- |
| 1   | _id       | ObjectId      | PK – mã giỏ hàng (tự sinh)            |
| 2   | userId    | ObjectId      | FK – tham chiếu `User._id` (duy nhất) |
| 3   | items     | ArrayCartItem | Danh sách sản phẩm trong giỏ          |
| 4   | createdAt | Date          | Thời điểm tạo                         |
| 5   | updatedAt | Date          | Thời điểm cập nhật                    |


**Cấu trúc nhúng CartItem:**


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                    |
| --- | --------- | ------------ | ---------------------------------------- |
| 1   | productId | ObjectId     | FK – tham chiếu `Product._id` (bắt buộc) |
| 2   | quantity  | Number       | Số lượng trong giỏ (bắt buộc, ≥ 1)       |


---

## 10. Wishlist – Danh sách yêu thích

*Bảng 10: Bảng Wishlist*


| STT | Tên cột    | Kiểu dữ liệu  | Mô tả                                 |
| --- | ---------- | ------------- | ------------------------------------- |
| 1   | _id        | ObjectId      | PK – mã wishlist (tự sinh)            |
| 2   | userId     | ObjectId      | FK – tham chiếu `User._id` (duy nhất) |
| 3   | productIds | ArrayObjectId | Danh sách `Product._id` đã yêu thích  |
| 4   | createdAt  | Date          | Thời điểm tạo                         |
| 5   | updatedAt  | Date          | Thời điểm cập nhật                    |


---

## 11. Order – Đơn hàng

*Bảng 11: Bảng Order*


| STT | Tên cột           | Kiểu dữ liệu    | Mô tả                                                                                        |
| --- | ----------------- | --------------- | -------------------------------------------------------------------------------------------- |
| 1   | _id               | ObjectId        | PK – mã đơn hàng (tự sinh)                                                                   |
| 2   | orderCode         | String          | Mã đơn hàng hiển thị (bắt buộc, duy nhất, VD: ORD-20240407-001)                              |
| 3   | userId            | ObjectId        | FK – tham chiếu `User._id` (null nếu đặt hàng không cần đăng nhập)                           |
| 4   | guestInfo.name    | String          | Họ tên khách vãng lai                                                                        |
| 5   | guestInfo.email   | String          | Email khách vãng lai                                                                         |
| 6   | guestInfo.phone   | String          | Điện thoại khách vãng lai                                                                    |
| 7   | shippingAddress   | Address (nhúng) | Địa chỉ giao hàng (nhúng toàn bộ cấu trúc Address)                                           |
| 8   | note              | String          | Ghi chú đơn hàng                                                                             |
| 9   | receivingTimeSlot | String          | Khung giờ nhận hàng mong muốn                                                                |
| 10  | paymentMethod     | String          | Phương thức thanh toán: `CashOnDelivery`, `BankTransfer`, `CreditCard`, `Ewallet`            |
| 11  | status            | String          | Trạng thái đơn: `Pending`, `Confirmed`, `Packing`, `Shipping`, `Delivered`, `Cancelled`, ... |
| 12  | items             | ArrayOrderItem  | Danh sách sản phẩm trong đơn (nhúng, xem bên dưới)                                           |
| 13  | subtotal          | Number          | Tổng tiền hàng (đ)                                                                           |
| 14  | discount          | Number          | Số tiền giảm giá (đ)                                                                         |
| 15  | shippingFee       | Number          | Phí vận chuyển (đ)                                                                           |
| 16  | total             | Number          | Tổng thanh toán = subtotal − discount + shippingFee (đ)                                      |
| 17  | couponCode        | String          | Mã giảm giá đã áp dụng                                                                       |
| 18  | allocations       | ArrayObject     | Phân bổ kho theo lô: `{ productId, batchId, quantity }`                                      |
| 19  | createdAt         | Date            | Thời điểm đặt hàng                                                                           |
| 20  | updatedAt         | Date            | Thời điểm cập nhật                                                                           |


**Cấu trúc nhúng OrderItem:**


| STT | Tên cột      | Kiểu dữ liệu | Mô tả                                     |
| --- | ------------ | ------------ | ----------------------------------------- |
| 1   | productId    | ObjectId     | FK – tham chiếu `Product._id`             |
| 2   | productName  | String       | Tên sản phẩm (chụp lại tại thời điểm đặt) |
| 3   | productImage | String       | URL ảnh sản phẩm (chụp lại)               |
| 4   | unit         | String       | Đơn vị tính (chụp lại)                    |
| 5   | supplier     | String       | Nhà cung cấp (chụp lại)                   |
| 6   | unitPrice    | Number       | Đơn giá tại thời điểm mua (đ)             |
| 7   | quantity     | Number       | Số lượng                                  |
| 8   | subtotal     | Number       | Thành tiền = unitPrice × quantity (đ)     |
| 9   | batchCode    | String       | Mã lô hàng được xuất kho                  |


---

## 12. Coupon – Mã giảm giá

*Bảng 12: Bảng Coupon*


| STT | Tên cột       | Kiểu dữ liệu | Mô tả                                                   |
| --- | ------------- | ------------ | ------------------------------------------------------- |
| 1   | _id           | ObjectId     | PK – mã bản ghi (tự sinh)                               |
| 2   | code          | String       | Mã giảm giá (bắt buộc, duy nhất, chữ hoa)               |
| 3   | discountType  | String       | Loại giảm: `PERCENT` (%) hoặc `FIXED` (số tiền cố định) |
| 4   | discountValue | Number       | Giá trị giảm (% hoặc đ, ≥ 0) (bắt buộc)                 |
| 5   | minOrderValue | Number       | Giá trị đơn hàng tối thiểu để áp dụng (mặc định: 0)     |
| 6   | startAt       | Date         | Thời điểm bắt đầu hiệu lực (bắt buộc)                   |
| 7   | endAt         | Date         | Thời điểm hết hạn (bắt buộc)                            |
| 8   | usageLimit    | Number       | Tổng số lần tối đa được dùng (mặc định: 100)            |
| 9   | perUserLimit  | Number       | Số lần tối đa mỗi user được dùng (mặc định: 2)          |
| 10  | usedCount     | Number       | Số lần đã sử dụng (mặc định: 0)                         |
| 11  | isActive      | Boolean      | Đang kích hoạt hay không (mặc định: true)               |
| 12  | createdAt     | Date         | Thời điểm tạo                                           |
| 13  | updatedAt     | Date         | Thời điểm cập nhật                                      |


---

## 13. CouponUsage – Lịch sử dùng mã giảm giá

*Bảng 13: Bảng CouponUsage*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                   |
| --- | --------- | ------------ | --------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã bản ghi (tự sinh)               |
| 2   | couponId  | ObjectId     | FK – tham chiếu `Coupon._id` (bắt buộc) |
| 3   | userId    | ObjectId     | FK – tham chiếu `User._id` (bắt buộc)   |
| 4   | orderId   | ObjectId     | FK – tham chiếu `Order._id` (bắt buộc)  |
| 5   | createdAt | Date         | Thời điểm sử dụng                       |
| 6   | updatedAt | Date         | Thời điểm cập nhật                      |


---

## 14. Contact – Liên hệ khách hàng

*Bảng 14: Bảng Contact*


| STT | Tên cột       | Kiểu dữ liệu | Mô tả                                                                              |
| --- | ------------- | ------------ | ---------------------------------------------------------------------------------- |
| 1   | _id           | ObjectId     | PK – mã liên hệ (tự sinh)                                                          |
| 2   | name          | String       | Họ tên người gửi (bắt buộc)                                                        |
| 3   | email         | String       | Email người gửi (bắt buộc)                                                         |
| 4   | subject       | String       | Tiêu đề liên hệ (bắt buộc)                                                         |
| 5   | message       | String       | Nội dung tin nhắn (bắt buộc)                                                       |
| 6   | status        | String       | Trạng thái: `Unread`, `Read`, `Contacted`, `Resolved`, `Failed` (mặc định: Unread) |
| 7   | internalNotes | String       | Ghi chú nội bộ của admin                                                           |
| 8   | createdAt     | Date         | Thời điểm gửi liên hệ                                                              |
| 9   | updatedAt     | Date         | Thời điểm cập nhật                                                                 |


---

## 15. ChatSession – Phiên chat tư vấn

*Bảng 15: Bảng ChatSession*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                                |
| --- | --------- | ------------ | ---------------------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã phiên chat (tự sinh)                         |
| 2   | userId    | ObjectId     | FK – tham chiếu `User._id` (null nếu khách vãng lai) |
| 3   | guestId   | String       | ID tạm thời cho khách chưa đăng nhập                 |
| 4   | title     | String       | Tiêu đề phiên chat (mặc định: "Tư vấn nông sản")     |
| 5   | createdAt | Date         | Thời điểm mở phiên                                   |
| 6   | updatedAt | Date         | Thời điểm cập nhật                                   |


---

## 16. ChatMessage – Tin nhắn chat

*Bảng 16: Bảng ChatMessage*


| STT | Tên cột    | Kiểu dữ liệu | Mô tả                                                 |
| --- | ---------- | ------------ | ----------------------------------------------------- |
| 1   | _id        | ObjectId     | PK – mã tin nhắn (tự sinh)                            |
| 2   | sessionId  | ObjectId     | FK – tham chiếu `ChatSession._id` (bắt buộc)          |
| 3   | role       | String       | Vai trò gửi: `user` hoặc `assistant` (bắt buộc)       |
| 4   | content    | String       | Nội dung tin nhắn (bắt buộc)                          |
| 5   | structured | Mixed        | Dữ liệu có cấu trúc bổ sung (JSON tùy ý, có thể null) |
| 6   | createdAt  | Date         | Thời điểm gửi                                         |
| 7   | updatedAt  | Date         | Thời điểm cập nhật                                    |


---

## 17. Notification – Thông báo

*Bảng 17: Bảng Notification*


| STT | Tên cột   | Kiểu dữ liệu | Mô tả                                                                                                                       |
| --- | --------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | _id       | ObjectId     | PK – mã thông báo (tự sinh)                                                                                                 |
| 2   | userId    | ObjectId     | FK – tham chiếu `User._id` (bắt buộc)                                                                                       |
| 3   | type      | String       | Loại thông báo: `ORDER_STATUS`, `NEW_ORDER`, `BATCH_NEAR_EXPIRY`, `BATCH_EXPIRED`, `COUPON_NEAR_EXPIRY`, `NEW_CONTACT`, ... |
| 4   | title     | String       | Tiêu đề thông báo (bắt buộc)                                                                                                |
| 5   | message   | String       | Nội dung thông báo (bắt buộc)                                                                                               |
| 6   | link      | String       | Đường dẫn liên quan (tùy chọn)                                                                                              |
| 7   | isRead    | Boolean      | Đã đọc chưa (mặc định: false)                                                                                               |
| 8   | meta      | Mixed        | Dữ liệu bổ sung (JSON tùy ý)                                                                                                |
| 9   | createdAt | Date         | Thời điểm tạo thông báo                                                                                                     |
| 10  | updatedAt | Date         | Thời điểm cập nhật                                                                                                          |


