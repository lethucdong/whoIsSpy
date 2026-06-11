Bạn là Senior Product Designer, Senior UX Designer, Senior Fullstack Engineer và Next.js Architect.

Hãy xây dựng một web game multiplayer hoàn chỉnh tên:

"AI LÀ GIÁN ĐIỆP?"

=================================================

MỤC TIÊU

=================================================

Xây dựng phiên bản online hiện đại của trò chơi "Ai Là Gián Điệp".

Đối tượng người dùng:

- Người Việt Nam
- Học sinh
- Sinh viên
- Nhóm bạn
- Gia đình
- Cộng đồng Discord
- Người dùng điện thoại

Ưu tiên:

- Mobile First
- Giao diện tiếng Việt
- Thao tác đơn giản
- Vào chơi trong vòng 10 giây

=================================================

TECH STACK

=================================================

Sử dụng:

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma ORM
- Neon PostgreSQL
- Server Actions
- Zod
- React Hook Form
- Framer Motion

Realtime:

- Socket.io

Triển khai:

- Vercel
- Neon

Không sử dụng:

- NestJS
- GraphQL
- Redux
- Microservice

=================================================

TÍNH NĂNG

=================================================

Người chơi có thể:

- Tạo phòng
- Tham gia phòng bằng mã
- Chia sẻ link mời
- Thiết lập luật chơi
- Bắt đầu trận đấu
- Xem từ khóa bí mật
- Thảo luận
- Bỏ phiếu
- Loại người chơi
- Chơi nhiều vòng
- Xem thống kê

=================================================

VAI TRÒ

=================================================

1. Dân Thường

Nhận từ khóa chính.

2. Gián Điệp

Nhận từ khóa khác nhưng có liên quan.

3. Người Mù

Không nhận từ khóa.

Hiển thị:

???

Người Mù phải suy luận từ khóa thông qua mô tả của những người khác.

=================================================

THIẾT LẬP PHÒNG

=================================================

Chủ phòng có thể cấu hình:

- Số lượng người chơi
- Số lượng gián điệp
- Số lượng người mù
- Thời gian thảo luận
- Thời gian bỏ phiếu
- Điều kiện chiến thắng

Ví dụ:

1 gián điệp còn sống khi tổng số người còn lại <= 3

=================================================

TRANG

=================================================

Trang chủ

/

Tạo phòng

/create-room

Tham gia phòng

/join-room

Phòng chờ

/room/[code]

Trận đấu

/game/[id]

Lịch sử

/history

Hồ sơ

/profile

=================================================

TRANG CHỦ

=================================================

Thiết kế phong cách game hiện đại.

Tiêu đề:

"Bạn có tìm ra gián điệp trước khi quá muộn?"

Nút:

[Tạo Phòng]

[Vào Phòng]

Phần:

- Cách chơi
- Tính năng
- Chế độ chơi
- FAQ

=================================================

PHÒNG CHỜ

=================================================

Hiển thị:

- Mã phòng
- Danh sách người chơi
- Chủ phòng
- Trạng thái sẵn sàng
- Thiết lập hiện tại
- Nút chia sẻ
- Nút bắt đầu

Realtime cập nhật người chơi.

=================================================

MÀN HÌNH LẬT THẺ

=================================================

Đây là màn hình quan trọng nhất.

Ban đầu:

[ Chạm để xem từ khóa ]

Sau khi bấm:

Ví dụ:

🍜 PHỞ

Hoặc:

🍲 BÚN BÒ

Hoặc:

❓ ???

Hiệu ứng:

- Lật thẻ
- Blur
- Glow
- Scale

=================================================

THẢO LUẬN

=================================================

Hiển thị:

- Vòng hiện tại
- Đồng hồ đếm ngược
- Người đang nói
- Danh sách người chơi
- Trạng thái còn sống

=================================================

BỎ PHIẾU

=================================================

Chọn người nghi ngờ.

Hiển thị:

- Avatar
- Tên
- Số phiếu

Có hiệu ứng công bố kết quả.

=================================================

KẾT QUẢ

=================================================

Hiển thị:

- Người bị loại
- Vai trò
- Từ khóa dân thường
- Từ khóa gián điệp
- Thống kê vòng

=================================================

DATABASE

=================================================

Thiết kế schema Prisma hoàn chỉnh cho:

User
Room
RoomPlayer
Game
Round
Vote
KeywordPair
PlayerRole
GameEvent

Sử dụng UUID.

Có đầy đủ index.

=================================================

BỘ TỪ KHÓA

=================================================

Thiết kế hệ thống 1000+ cặp từ khóa tiếng Việt.

Danh mục:

- Đồ ăn
- Đồ uống
- Động vật
- Trường học
- Nghề nghiệp
- Công nghệ
- Mạng xã hội
- Người nổi tiếng Việt Nam
- Địa danh Việt Nam
- Tỉnh thành Việt Nam
- Thương hiệu Việt Nam
- Phim ảnh
- Âm nhạc
- Thể thao
- Đồ vật
- Phương tiện
- Du lịch
- Internet
- Meme Việt Nam

Độ khó:

- Dễ
- Trung bình
- Khó

=================================================

THIẾT KẾ

=================================================

Phong cách:

- Dark Mode
- Glassmorphism
- Gaming UI hiện đại

Tham khảo:

Discord
Spotify
Linear

Màu sắc:

Background:
#0F172A

Card:
#1E293B

Primary:
#6366F1

Success:
#22C55E

Danger:
#EF4444

Text:
#F8FAFC

=================================================

OUTPUT

=================================================

Xuất đầy đủ:

1. Product Specification

2. User Flow

3. Information Architecture

4. Prisma Schema

5. Database ERD

6. Folder Structure

7. Route Structure

8. Server Actions

9. Socket Events

10. Component Hierarchy

11. UI Design System

12. Wireframes

13. Mobile Screens

14. Desktop Screens

15. Animation Specs

16. MVP Roadmap

17. Production Roadmap

18. Kế hoạch triển khai trên Vercel + Neon

Mọi nội dung giao diện, trạng thái, thông báo và UX phải sử dụng tiếng Việt tự nhiên dành cho người dùng Việt Nam.