# Kế hoạch Triển khai Dự án (Implementation Plan) - LegacyVault

Tài liệu này xác định lộ trình thực hiện, chia nhỏ các giai đoạn dựa trên luồng nghiệp vụ và độ ưu tiên của các tính năng cốt lõi (dựa theo chuẩn SRS). 

## Giai đoạn 1: Khởi tạo Kiến trúc & Hạ tầng Bảo mật (Tuần 1 - 2)
**Mục tiêu:** Xây dựng móng vững chắc với kiến trúc Zero-Knowledge và hệ thống phân quyền (RBAC).

*   **Nghiệp vụ & Chức năng:**
    *   Thiết kế CSDL (Database Schema) cho toàn bộ hệ thống (Users, Vaults, Assets, Configs, Logs).
    *   Thiết lập Hệ thống Xác thực & Phân quyền (RBAC) với 5 Role chính: `Admin`, `Vault Owner`, `Executor`, `Verifier`, `Beneficiary`.
    *   Phát triển Module mã hóa **Client-Side (Zero-Knowledge):** Tích hợp thư viện mã hóa Web Crypto API (AES-256-GCM) ở phía frontend để đảm bảo dữ liệu không bao giờ rời khỏi thiết bị dưới dạng bản rõ (plaintext).
    *   Thiết lập cơ sở hạ tầng lưu trữ file đám mây (Object Storage) cho tài liệu đính kèm.
*   **Deliverables:**
    *   Môi trường Dev/Staging được thiết lập.
    *   Khung Backend (RESTful APIs) và Frontend cơ bản.
    *   Luồng Đăng ký / Đăng nhập (Authentication) hoàn thiện.

## Giai đoạn 2: Quản lý Kho & Tài sản Số (Vault Owner) (Tuần 3 - 4)
**Mục tiêu:** Cung cấp đầy đủ công cụ cho "Chủ kho" khởi tạo và đưa dữ liệu vào an toàn.

*   **Nghiệp vụ & Chức năng:**
    *   Phát triển tính năng CRUD (Tạo, Đọc, Cập nhật, Xóa) cho **Kho lưu trữ (Vault)**.
    *   Phát triển chức năng Quản lý **Tài sản số (Digital Assets):** (Ngân hàng, Crypto, Mạng xã hội, Tài liệu pháp lý). Đảm bảo mọi payload đều phải qua module mã hóa của Giai đoạn 1 trước khi gửi API.
    *   Tính năng gán **Người thụ hưởng (Beneficiary)** cho từng tài sản hoặc gói tài sản.
    *   Chức năng mời và phân quyền cho **Người thi hành di chúc (Digital Executor)**.
*   **Deliverables:**
    *   Chủ kho có thể tự tạo kho và lưu trữ thông tin tài sản đã được mã hóa.

## Giai đoạn 3: Hệ thống Dead Man's Switch (Động cơ Sinh tồn) (Tuần 5 - 6)
**Mục tiêu:** Tự động hóa quá trình kiểm tra sinh tồn và quản lý chuyển đổi trạng thái (State Machine) của Vault.

*   **Nghiệp vụ & Chức năng:**
    *   Phát triển giao diện để Chủ kho cấu hình chu kỳ điểm danh (VD: 30 ngày) và thời gian ân hạn (VD: 14 ngày).
    *   Tích hợp Nút bấm **"Tôi vẫn ổn" (Check-in/Heartbeat)** cho Chủ kho để reset Timer.
    *   Xây dựng hệ thống Background Jobs (Cron Schedulers/Workers):
        *   Job 1: Quét định kỳ và gửi cảnh báo nhắc nhở Chủ kho.
        *   Job 2: Đánh dấu quá hạn (Grace Period timeout) và tự động đổi trạng thái Vault sang `PENDING_VERIFICATION`, gửi thông báo cho Executor.
*   **Deliverables:**
    *   Hệ thống tự động phát hiện người dùng ngắt kết nối và gửi thông báo đúng hạn.

## Giai đoạn 4: Quy trình Pháp lý & Thẩm định (Executor & Verifier) (Tuần 7 - 8)
**Mục tiêu:** Luồng nghiệp vụ nộp và phê duyệt hồ sơ chứng tử khép kín, minh bạch.

*   **Nghiệp vụ & Chức năng:**
    *   **Portal Executor:** Giao diện cho phép Executor nhận thông báo, nộp file scan Giấy chứng tử và yêu cầu mở kho.
    *   **Portal Verifier:** Giao diện cho Luật sư / Công chứng viên tiếp nhận hồ sơ, kiểm tra tính pháp lý.
    *   Tích hợp tính năng **Ký số điện tử (Digital Signature)**: Verifier phê duyệt bằng chữ ký điện tử để kích hoạt mở khóa.
    *   Xử lý logic chuyển đổi trạng thái Vault: `PENDING_VERIFICATION` ➔ `UNLOCKED`.
*   **Deliverables:**
    *   Luồng mở khóa kho thông qua chứng thực pháp lý thành công.

## Giai đoạn 5: Xác thực Danh tính (eKYC) & Bàn giao Tài sản (Beneficiary) (Tuần 9 - 10)
**Mục tiêu:** Đảm bảo bàn giao đúng người thụ hưởng và giải mã tài sản thành công.

*   **Nghiệp vụ & Chức năng:**
    *   Tích hợp dịch vụ **eKYC (Nhận diện khuôn mặt, quét CCCD/Hộ chiếu)** qua API bên thứ ba.
    *   Gửi thông báo OTP / Email tự động đến Người thụ hưởng.
    *   Phát triển Portal cho Beneficiary: Sau khi pass eKYC, nhận "Khóa giải mã" (Key) để giải mã các gói tài sản (decrypt tại frontend) và tải xuống thiết bị.
    *   Xác nhận đã nhận tài sản và tự động đóng kho (Đổi trạng thái ➔ `CLOSED`).
*   **Deliverables:**
    *   Luồng nhận thừa kế bảo mật hoàn chỉnh.

## Giai đoạn 6: Hoàn thiện, Nhật ký & Bàn giao (Tuần 11 - 12)
**Mục tiêu:** Đảm bảo độ ổn định, khả năng truy vết và bảo mật hệ thống.

*   **Nghiệp vụ & Chức năng:**
    *   Xây dựng hệ thống **Nhật ký bất biến (Immutable Audit Log)**: Ghi lại mọi hành động nhạy cảm trong hệ thống.
    *   Phát triển Dashboard cho **System Admin**: Theo dõi hệ thống, quản lý tài khoản, quản lý API webhook (eKYC, SMS).
    *   Kiểm thử bảo mật (Pen-test cho luồng mã hóa Client-Side) và Performance testing.
    *   Dọn dẹp mã nguồn, viết tài liệu Hướng dẫn sử dụng (User Manual) và triển khai lên Production.
*   **Deliverables:**
    *   Hệ thống sẵn sàng Go-live (Production-Ready).

## Giai đoạn Đặc biệt: Nâng cấp Toàn diện Giao diện (UI Redesign) với React Bootstrap
**Mục tiêu:** Giải quyết triệt để lỗi giao diện bị "đơ", không phản hồi do xung đột CSS; đồng thời mang lại trải nghiệm chuyên nghiệp, đồng nhất cho toàn bộ các vai trò trong hệ thống.

*   **Phạm vi áp dụng (Toàn bộ Dự án):**
    *   **Trang Khách/Xác thực:** (Đăng nhập, Đăng ký) - Chuyển sang sử dụng Component Form, Alert, Button chuẩn của React Bootstrap.
    *   **Role Chủ sở hữu (Owner):** Cấu trúc lại toàn bộ các trang Dashboard, Assets, Beneficiaries, Documents, Logs, Switch sang hệ thống Grid (Container, Row, Col), Card và Modal chuẩn.
    *   **Role Người thi hành (Executor):** Làm lại giao diện Portal tiếp nhận thông báo, form nộp file giấy chứng tử, bảng theo dõi tiến độ xử lý.
    *   **Role Người kiểm duyệt (Verifier):** Thiết kế lại bảng (Table) tiếp nhận hồ sơ, giao diện kiểm tra chéo và các nút phê duyệt.
    *   **Role Người thụ hưởng (Beneficiary):** Giao diện quét eKYC và nhận khóa giải mã tài sản trực quan, hỗ trợ tốt cho di động.
    *   **Role Quản trị (Admin):** Nâng cấp hệ thống bảng biểu, phân trang (Pagination) cho hệ thống Audit Logs và quản trị người dùng.
*   **Quy chuẩn Kỹ thuật:**
    *   Sử dụng độc quyền các components của `react-bootstrap` (thay vì thẻ `div` với CSS tùy chỉnh cũ).
    *   Sử dụng hệ thống màu Semantic của Bootstrap (Primary, Warning, Danger, Success) để điều hướng cảm xúc người dùng (ví dụ: Cảnh báo đỏ cho Dead Man's Switch hết hạn).
    *   Đảm bảo 100% trang được tối ưu Responsive (di động, máy tính bảng) thông qua Bootstrap Grid System.

## Giai đoạn 7: Nâng cấp Mức độ Production (Production-Ready Enhancements)
**Mục tiêu:** Thay thế các thành phần giả lập (mock) bằng các dịch vụ thực tế, gia tăng bảo mật và chuẩn bị cho triển khai quy mô lớn.

*   **Nghiệp vụ & Chức năng:**
    *   **Dịch vụ Gửi thông báo (Email / SMS):** Thay thế `emailService.js` (hiện tại in log) bằng tích hợp Nodemailer/SendGrid (Email) và Twilio/Stringee (SMS) cho luồng mã xác nhận, thông báo quên mật khẩu và nhắc nhở điểm danh.
    *   **Lưu trữ Đám mây (Object Storage):** Di chuyển cơ chế lưu file tĩnh từ local (`multer` -> `./uploads`) sang hệ thống AWS S3 hoặc Google Cloud Storage để đảm bảo tính an toàn dữ liệu pháp lý.
    *   **Chữ ký số thực sự (Digital Signature):** Tích hợp với nhà cung cấp dịch vụ chứng thực chữ ký số công cộng (như VNPT CA, Viettel CA) vào Portal của Verifier thay vì chỉ phê duyệt bằng state.
    *   **Xác thực 2 yếu tố (2FA/MFA):** Hoàn thiện API cấp phát mã QR (Google Authenticator) và bổ sung luồng nhập mã OTP 6 số ở màn hình Đăng nhập khi `mfaEnabled` bật.
    *   **eKYC Đích thực:** Kết nối luồng quét ảnh khuôn mặt và Hộ chiếu/CCCD của Beneficiary vào API eKYC chuyên dụng (FPT.AI / VNPT eKYC).
    *   **Cấu hình Webhooks (Admin):** Xây dựng luồng mã hóa AES hai chiều để Admin lưu trữ an toàn các API Key (SendGrid, Twilio, eKYC) vào database thay vì hardcode.
*   **Deliverables:**
    *   Hệ thống vận hành với dữ liệu thực, kết nối thành công với các dịch vụ bên thứ ba và sẵn sàng kiểm tra an toàn thông tin độc lập.
