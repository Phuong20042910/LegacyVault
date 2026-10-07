# SRS: LegacyVault - Hệ thống Quản lý Di sản số & Bàn giao Tài sản Kỹ thuật số
*(Digital Heritage & Trust Inheritance Platform - Secure Legacy Vault)*

> **Mã đề tài:** SWP391_FA26_TOPIC_06  
> **Giảng viên phụ trách:** ChiLTQ6  
> **Phiên bản:** 1.0.0 (Production-Ready Spec)  
> **Trạng thái:** APPROVED  
> **Nguyên tắc cốt lõi:** Zero-Knowledge Architecture, End-to-End Encryption (E2EE), Fail-Safe Dead Man's Switch, Strict Role-Based Access Control (RBAC).

---

## 1. TỔNG QUAN DỰ ÁN & PHẠM VI (PROJECT SCOPE)

### 1.1. Mục tiêu hệ thống (Objective)
Giải quyết bài toán thất thoát và tranh chấp tài sản kỹ thuật số (tài khoản ngân hàng, ví tiền mã hóa, tài khoản mạng xã hội, tài liệu bảo mật cá nhân) khi chủ sở hữu đột ngột qua đời hoặc mất năng lực hành vi:
1. **Bảo mật tuyệt đối khi còn sống:** Áp dụng mô hình mã hóa Zero-Knowledge; dữ liệu được mã hóa tại thiết bị người dùng (Client-side), máy chủ và quản trị viên hệ thống hoàn toàn không thể đọc được nội dung gốc.
2. **Cơ chế kích hoạt sinh tồn đáng tin cậy:** Triển khai cơ chế *Dead Man's Switch (DMS)* với nhiều lớp cảnh báo phòng ngừa kích hoạt nhầm (False Positive = 0%).
3. **Thẩm định pháp lý minh bạch:** Yêu cầu Người thi hành di chúc (Digital Executor) xuất trình chứng tử và có sự thẩm định, ký duyệt điện tử từ Người xác minh pháp lý/Công chứng viên (Legal Verifier / Notary) trước khi giải phóng khóa giải mã cho Người thụ hưởng (Beneficiary).

---

### 1.2. Phân loại vai trò người dùng (System Actors)

| Vai trò (Actor) | Mô tả trách nhiệm chính |
|---|---|
| **Vault Owner (Chủ sở hữu kho)** | Cá nhân khởi tạo kho lưu trữ, mã hóa tài sản số, chỉ định người thụ hưởng, cấu hình quy tắc Dead Man's Switch và quản lý quyền của người thi hành. |
| **Digital Executor / Trustee (Người thi hành di chúc)** | Cá nhân hoặc tổ chức được ủy quyền (người thân, luật sư); tiếp nhận cảnh báo kích hoạt khi chủ sở hữu vắng mặt, nộp giấy chứng tử để xin mở kho và điều phối bàn giao. |
| **Beneficiary (Người thụ hưởng)** | Cá nhân/tổ chức được chỉ định nhận tài sản; thực hiện xác thực định danh (eKYC / OTP) để tải xuống tài liệu và khóa truy cập tài sản được phân bổ. |
| **Legal Verifier / Notary (Người xác minh pháp lý)** | Luật sư, công chứng viên có thẩm quyền; rà soát tính hợp pháp của giấy chứng tử, xác minh tài liệu và ký số để kích hoạt mở khóa kho lưu trữ. |
| **System Administrator (Quản trị viên hệ thống)** | Quản lý tài khoản, cấu hình RBAC, giám sát nhật ký an ninh (Audit Log) chống giả mạo, thiết lập cấu hình tích hợp dịch vụ bên thứ ba (eKYC, Digital Signatures). |

---

### 1.3. Phạm vi triển khai (In-Scope)

#### A. Tính năng cốt lõi bắt buộc (Must-Have / Core Features)
- [ ] **Vault Management & E2EE:** Tạo, cập nhật, xóa và mã hóa đầu-cuối hồ sơ tài sản số (ngân hàng, crypto, tài liệu bảo mật) tại client.
- [ ] **Beneficiary Assignment:** Gán người thụ hưởng cụ thể cho từng tài sản hoặc gói tài sản.
- [ ] **Dead Man's Switch Engine:** Cấu hình chu kỳ điểm danh, thời gian chờ (grace period), batch job tự động gửi kiểm tra sinh tồn và batch job phát hiện quá hạn để chuyển trạng thái.
- [ ] **Heartbeat Reset:** Chủ sở hữu điểm danh (Check-in 1-click hoặc đăng nhập) để reset bộ đếm thời gian.
- [ ] **Legal Verification Submission:** Người thi hành nộp giấy chứng tử và yêu cầu mở kho.
- [ ] **Legal Approval Workflow:** Người xác minh pháp lý thẩm định giấy tờ và thực hiện ký điện tử phê duyệt mở khóa.
- [ ] **Beneficiary Claim & eKYC:** Người thụ hưởng nhận thông báo, vượt qua xác thực danh tính (eKYC + OTP) và tải khóa/tài liệu đã giải mã.
- [ ] **RBAC & User Management:** Quản trị viên quản lý danh mục người dùng và phân quyền truy cập chặt chẽ.

#### B. Tính năng nâng cao / Tùy chọn (Nice-to-Have / Optional Features)
- [ ] **Audit Log Viewer for Owner:** Cho phép chủ kho xem lại toàn bộ lịch sử truy cập và thao tác trên kho của mình.
- [ ] **Delivery Progress Tracking:** Cho phép người thi hành di chúc theo dõi tiến độ bàn giao thực tế của từng tài sản đến tay từng người thụ hưởng.
- [ ] **Secure Communication Channel:** Kênh nhắn tin nội bộ bảo mật và trao đổi tài liệu bổ sung giữa Executor và Legal Verifier.
- [ ] **Automated Signature Validation Engine:** Động cơ tự động kiểm tra tính toàn vẹn và chữ ký số trên tài liệu pháp lý qua cổng công chứng điện tử.
- [ ] **Beneficiary Receipt Confirmation:** Người thụ hưởng bấm xác nhận đã nhận bàn giao để đóng trạng thái hồ sơ tài sản (Archive/Close).
- [ ] **Security Anomaly Detection:** Tự động cảnh báo khi có đăng nhập từ IP lạ, brute-force hoặc truy cập kho bất thường.
- [ ] **System Policy Management:** Quản trị viên tùy biến tham số mặc định của DMS, chính sách mã hóa và lịch sao lưu dữ liệu toàn hệ thống.
- [ ] **Third-party Provider Config:** Quản lý kết nối API, Webhook cho eKYC, dịch vụ chữ ký số (PKI).
- [ ] **Shamir's Secret Sharing (SSS):** Cơ chế chia nhỏ khóa master thành nhiều mảnh (m-of-n threshold) phân bổ cho Executor và Verifier.

---

### 1.4. Ngoài phạm vi (Out-of-Scope - TUYỆT ĐỐI KHÔNG THỰC HIỆN)
- **KHÔNG thực hiện giao dịch chuyển tiền trực tiếp:** Hệ thống không kết nối trực tiếp với Core Banking hay Smart Contract blockchain để tự động chuyển tiền hoặc chuyển token. Hệ thống chỉ lưu trữ và chuyển giao an toàn thông tin truy cập (credentials, private keys, seed phrases, tài liệu ủy quyền).
- **KHÔNG quản lý di sản vật lý:** Không hỗ trợ kiểm kê, vận chuyển đồ dùng vật lý, vàng miếng hay bất động sản truyền thống.
- **KHÔNG tự động cấp chứng tử:** Hệ thống không thay thế cơ quan nhà nước; bắt buộc phải có con người (Legal Verifier) phê duyệt giấy tờ hợp lệ.

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES - BR)

* **BR-001 (Zero-Knowledge Data Storage):** Dữ liệu nhạy cảm (thông tin tài khoản, khóa ví, nội dung di chúc) phải được mã hóa bằng thuật toán đối xứng mạnh (AES-256-GCM) ngay tại trình duyệt/ứng dụng của Vault Owner trước khi gửi lên API. Server chỉ lưu Ciphertext và Metadata.
* **BR-002 (Beneficiary Mapping Matrix):** Một tài sản có thể được gán cho đúng một người thụ hưởng chính và tối đa một người thụ hưởng dự phòng. Người thụ hưởng chỉ được nhìn thấy tài sản được chỉ định riêng cho họ.
* **BR-003 (Dead Man's Switch Timing Rules):**
  - Chu kỳ kiểm tra sinh tồn (T_check): Thiết lập từ 7 ngày đến 365 ngày (Mặc định: 30 ngày).
  - Thời gian ân hạn cảnh báo (T_grace): Cố định 14 ngày kể từ khi T_check kết thúc mà không có phản hồi.
  - Tần suất cảnh báo: Trong giai đoạn ân hạn, hệ thống gửi thông báo nhắc nhở vào các ngày: ngày thứ 1, ngày thứ 7, ngày thứ 12 và liên tục trong 48 giờ cuối cùng.
* **BR-004 (Executor Revocation Rule):** Khi Vault Owner còn hoạt động (VaultStatus = ACTIVE), Owner có quyền tối thượng thêm mới, thay đổi hoặc thu hồi ngay lập tức quyền của Digital Executor mà không cần sự đồng ý của Executor.
* **BR-005 (Fail-Safe Verification Gate):** Không một ai (kể cả Executor hay Admin) được phép kích hoạt giải mã kho nếu thiếu Biên bản phê duyệt điện tử kèm Chữ ký số (Digital Signature) của Legal Verifier.
* **BR-006 (eKYC Enforcement Before Claim):** Người thụ hưởng bắt buộc phải hoàn thành quy trình eKYC (quét CCCD/Hộ chiếu + so khớp khuôn mặt Liveness Check) và nhập OTP gửi về số điện thoại/email chính chủ thì mới được hiển thị nút giải mã và tải dữ liệu.
* **BR-007 (Audit Immutability):** Mọi hành vi (tạo tài sản, sửa cấu hình, gửi ping sinh tồn, đăng nhập, nộp chứng từ, duyệt hồ sơ, tải khóa) phải được ghi vào bảng nhật ký bất biến (Append-only). Không một vai trò nào, kể cả Super Admin, có quyền chỉnh sửa (UPDATE) hoặc xóa (DELETE) các bản ghi này.
* **BR-008 (Vault Lifecycle State Machine):** Kho lưu trữ tuân thủ nghiêm ngặt cỗ máy trạng thái:
  ACTIVE -> GRACE_PERIOD -> PENDING_VERIFICATION -> UNLOCKED -> CLOSED.
  Tại bất kỳ thời điểm nào trong trạng thái GRACE_PERIOD, nếu Owner bấm nút "Tôi vẫn ổn", trạng thái lập tức quay về ACTIVE và bộ đếm thời gian được reset.

---

## 3. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

### Module 1: Vault Owner Management (Dành cho Chủ kho)
* **FR-001 (CRUD & Mã hóa tài sản số):** Hệ thống cung cấp giao diện cho phép Owner thêm, sửa, xóa, phân loại (Ngân hàng, Crypto, Mạng xã hội, Tài liệu mật). Dữ liệu được mã hóa client-side trước khi truyền qua API. [Must-Have | BR-001]
* **FR-002 (Phân quyền người thụ hưởng):** Cung cấp giao diện gán danh tính Beneficiary (Email, SĐT, CCCD) tương ứng với từng mục tài sản đã đăng ký. [Must-Have | BR-002]
* **FR-003 (Cấu hình Dead Man's Switch):** Cho phép thiết lập tần suất kiểm tra, kênh thông báo ưu tiên (Email, SMS, Mobile Push) và thông tin liên hệ khẩn cấp. [Must-Have | BR-003]
* **FR-004 (Tải lên tài liệu pháp lý E2EE):** Hỗ trợ tải lên tài liệu định dạng PDF, JPG, PNG (tối đa 500MB) chứa di chúc scan hoặc giấy chứng nhận quyền sở hữu, tự động mã hóa AES-256 trước khi lưu vào Object Storage. [Must-Have | BR-001]
* **FR-005 (Tra cứu nhật ký kho cá nhân):** Hiển thị danh sách lịch sử truy cập, các lần điểm danh và thay đổi cấu hình kho cho Owner theo dõi. [Nice-to-Have | BR-007]
* **FR-006 (Quản lý người thi hành di chúc):** Cho phép Owner mời Executor bằng email định danh, cấp quyền quản lý hoặc thu hồi quyền truy cập bất kỳ lúc nào. [Must-Have | BR-004]
* **FR-008 (Tiếp nhận phản hồi sinh tồn & Reset Timer):** Cung cấp cơ chế xác nhận sinh tồn nhanh qua nút bấm 1-click trong email (token an toàn sử dụng một lần) hoặc nút "Xác nhận tôi vẫn ổn" trên web dashboard. [Must-Have | BR-003, BR-008]

### Module 2: Dead Man's Switch Automation Engine (Động cơ tự động)
* **FR-007 (Batch Job gửi Ping sinh tồn định kỳ):** Chạy tác vụ nền (Cron Scheduler) quét định kỳ hàng giờ để gửi thông báo kiểm tra sinh tồn tới các tài khoản đã đến hạn kiểm tra. [Must-Have | BR-003]
* **FR-009 (Batch Job phát hiện bất động & Kích hoạt bàn giao):** Tự động phát hiện các tài khoản hết hạn GRACE_PERIOD mà không phản hồi; tự động chuyển trạng thái kho sang PENDING_VERIFICATION và gửi thông báo khẩn cấp tới Digital Executor. [Must-Have | BR-003, BR-008]

### Module 3: Digital Executor Operations (Người thi hành di chúc)
* **FR-010 (Portal xem danh sách tài sản ủy quyền):** Sau khi nhận thông báo kích hoạt, Executor đăng nhập để xem danh sách tài sản ủy quyền (chỉ xem metadata như tên tài sản, loại tài sản) và văn bản hướng dẫn bàn giao của Owner. [Must-Have | BR-005]
* **FR-011 (Nộp hồ sơ chứng tử & Xin mở kho):** Giao diện cho phép Executor tải lên bản scan Giấy chứng tử (Death Certificate), thông tin nơi cấp và gửi yêu cầu thẩm định đến Legal Verifier. [Must-Have | BR-005]
* **FR-012 (Theo dõi tiến độ bàn giao di sản):** Bảng dashboard theo dõi trạng thái tiếp nhận của từng Beneficiary (Chưa thông báo, Chờ KYC, Đã mở khóa, Đã tải về). [Nice-to-Have]
* **FR-013 (Kênh trao đổi hồ sơ bảo mật):** Khung chat và đính kèm tài liệu bổ sung trực tiếp giữa Executor và Legal Verifier trong trường hợp giấy tờ cần làm rõ. [Nice-to-Have]

### Module 4: Legal Verifier & Notary (Người xác minh pháp lý)
* **FR-014 (Quy trình thẩm định hồ sơ):** Giao diện tiếp nhận hồ sơ xin mở kho từ Executor, xem giấy chứng tử đính kèm, kiểm tra thông tin đối chiếu và đưa ra quyết định: Phê duyệt hoặc Từ chối (kèm lý do). [Must-Have | BR-005]
* **FR-015 (Xác thực chữ ký số tài liệu pháp lý):** Động cơ kiểm tra tính hợp lệ của chữ ký số PKI trên các văn bản điện tử được nộp vào hệ thống. [Nice-to-Have]
* **FR-016 (Ký duyệt điện tử mở khóa Vault):** Khi phê duyệt, Verifier sử dụng Private Key / Chứng thư số cá nhân ký số vào quyết định mở khóa để kích hoạt mở khóa kho lưu trữ sang trạng thái UNLOCKED. [Must-Have | BR-005]
* **FR-017 (Tra cứu lịch sử thẩm định):** Xem lại toàn bộ danh sách các hồ sơ mình đã từng thẩm định và nhật ký lưu trữ quyết định pháp lý. [Nice-to-Have]

### Module 5: Beneficiary Access & Claim (Người thụ hưởng)
* **FR-018 (Hệ thống gửi thông báo nhận thừa kế):** Tự động gửi thông báo qua Email và SMS đến người thụ hưởng khi kho chuyển sang trạng thái UNLOCKED. [Must-Have | BR-006]
* **FR-019 (Tích hợp xác thực eKYC):** Yêu cầu người thụ hưởng quét giấy tờ tùy thân và nhận diện khuôn mặt qua cổng eKYC tích hợp trước khi cho phép truy cập tài sản. [Must-Have | BR-006]
* **FR-020 (Portal giải mã và nhận tài sản):** Sau khi xác thực danh tính thành công, client nhận khóa giải mã được ủy quyền, tiến hành giải mã dữ liệu trực tiếp trên trình duyệt của Beneficiary và cho phép tải file đính kèm/thông tin tài khoản an toàn. [Must-Have | BR-001, BR-006]
* **FR-021 (Xác nhận đã nhận & Lưu trữ hồ sơ):** Beneficiary tích chọn xác nhận đã tiếp quản tài sản thành công. Khi tất cả tài sản trong kho được xác nhận, hệ thống tự động đưa Vault về trạng thái CLOSED. [Nice-to-Have | BR-008]

### Module 6: System Administrator & Cryptographic Infrastructure (Quản trị hệ thống)
* **FR-022 (Quản trị RBAC & Tài khoản người dùng):** Quản lý danh sách người dùng, cấp phát và khóa quyền truy cập của các vai trò (Admin, Verifier, Executor, Owner, Beneficiary). [Must-Have]
* **FR-023 (Giám sát nhật ký an ninh & Cảnh báo bất thường):** Theo dõi Audit Log tập trung, kích hoạt cảnh báo khi phát hiện đăng nhập sai liên tiếp hoặc truy cập trái phép. [Nice-to-Have | BR-007]
* **FR-024 (Cấu hình chính sách hệ thống):** Cho phép cấu hình các tham số hệ thống: thời gian ping mặc định, chính sách mã hóa và lịch backup tự động. [Nice-to-Have]
* **FR-025 (Quản lý kết nối nhà cung cấp bên thứ 3):** Quản lý cấu hình API Keys, Endpoint, Webhook secret của dịch vụ eKYC và SMS Gateway. [Nice-to-Have]
* **FR-026 (Quản lý khóa & Chia sẻ bí mật đa tầng):** Tích hợp thuật toán phân tách khóa (Shamir's Secret Sharing hoặc Multi-Key wrapping) đảm bảo khóa giải mã Master Vault chỉ có thể khôi phục khi có đủ chữ ký hợp lệ của Verifier và xác thực của Beneficiary. [Must-Have | BR-001, BR-005]

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

| Mã NFR | Phân loại | Tiêu chuẩn kỹ thuật định lượng | Độ ưu tiên |
|---|---|---|---|
| **NFR-001** | **Bảo mật** | **Zero-Knowledge Architecture:** Dữ liệu nhạy cảm được mã hóa đối xứng bằng AES-256-GCM ở client. Khóa mã hóa trao đổi qua RSA-4096 hoặc ECC (Curve25519). Database tuyệt đối không chứa bản rõ (plaintext) của mật khẩu, secret keys hoặc thông tin tài sản. | **Bắt buộc (High)** |
| **NFR-002** | **Bảo mật** | **Định danh đa nhân tố (MFA / eKYC):** Bắt buộc xác thực 2 bước (TOTP/SMS OTP) khi đăng nhập. Thao tác nhận tài sản của Beneficiary bắt buộc vượt qua luồng eKYC đạt độ chính xác khuôn mặt FAR <= 0.001% và FRR <= 1%. | **Bắt buộc (High)** |
| **NFR-003** | **Toàn vẹn** | **Nhật ký bất biến (Immutable Audit Log):** Lưu trữ log trên hệ thống lưu trữ ghi một lần đọc nhiều lần (WORM compliant) hoặc cơ sở dữ liệu có kiểm tra mã hash SHA-256 chuỗi khối. Thời gian lưu trữ tối thiểu **7 năm**. | **Bắt buộc (High)** |
| **NFR-004** | **Sẵn sàng** | **SLA đạt 99.99%:** Đảm bảo hệ thống hoạt động liên tục; các tác vụ nền Dead Man's Switch Scheduler và Notification Queue chạy cơ chế Master-Slave hoặc Distributed Worker để không có điểm chết đơn lẻ (SPOF). | **Bắt buộc (High)** |
| **NFR-005** | **Phục hồi** | **Disaster Recovery (DR):** RPO = 0 (dữ liệu giao dịch được replicate đa vùng địa lý theo thời gian thực); RTO <= 4 giờ khi toàn bộ cụm máy chủ chính gặp thảm họa. | **Bắt buộc (High)** |
| **NFR-006** | **Hiệu năng** | **Truyền tải tệp lớn:** Hỗ trợ upload và download tệp mã hóa dung lượng tối đa **500 MB/file**. Hệ thống duy trì ổn định, không timeout khi có 100 phiên truyền tải đồng thời trên băng thông tối thiểu 20 Mbps. | **Trung bình (Medium)** |
| **NFR-007** | **Hiệu năng** | **Thời gian phản hồi API:** 95% số lượng request (P95) tới API đọc/ghi dữ liệu thông thường phải có độ trễ phản hồi <= 1.5 giây, thời gian phản hồi tối đa không vượt quá 3.0 giây. | **Trung bình (Medium)** |
| **NFR-008** | **Độ tin cậy** | **Ngăn ngừa kích hoạt nhầm Dead Man's Switch:** Thiết kế cơ chế cảnh báo nhiều lớp (Email, SMS, App Push) trước 24 giờ của mỗi mốc quan trọng. Tỷ lệ kích hoạt nhầm (False Positive Rate) mục tiêu là 0%. | **Bắt buộc (High)** |
| **NFR-009** | **Vòng đời** | **Lưu trữ dài hạn & Tiêu hủy an toàn:** Dữ liệu mã hóa của tài khoản không hoạt động được duy trì tối thiểu **10 năm**. Sau khi bàn giao hoàn tất và trải qua thời gian chờ pháp lý **90 ngày**, hệ thống kích hoạt cơ chế xóa cứng (Physical Secure Erase) toàn bộ ciphertext khỏi ổ đĩa. | **Trung bình (Medium)** |
| **NFR-010** | **Mở rộng** | **Kiến trúc Adapter cho kết nối ngoài:** Áp dụng mô hình thiết kế Adapter Pattern cho các module tích hợp eKYC, SMS Gateway và Chữ ký số, cho phép tích hợp nhà cung cấp mới trong thời gian <= 2 tuần. | **Trung bình (Medium)** |
| **NFR-011** | **Di chuyển** | **Data Portability:** Cho phép Vault Owner xuất (export) toàn bộ dữ liệu dự phòng cá nhân dưới dạng tệp nén ZIP có mật khẩu bảo vệ kèm JSON metadata chuẩn hóa khi Owner còn sống. | **Thấp (Low)** |

---

## 5. MÔ HÌNH DỮ LIỆU CỐT LÕI (CORE DATA MODELS)

```
[VaultOwner] 1 ─────── n [Vault] 1 ─────── n [DigitalAsset] 1 ────── 1 [Beneficiary]
                           │
                           ├─────── 1 [DeadMansSwitchConfig]
                           ├─────── n [ExecutorAssignment]
                           ├─────── n [VerificationRequest] 1 ─── 1 [LegalVerifier]
                           └─────── n [AuditLog]
```

### 5.1. Bảng `Vaults` (Kho lưu trữ)
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | Khóa chính |
| `owner_id` | UUID | FK, NOT NULL | Tham chiếu người dùng sở hữu kho |
| `vault_name` | VARCHAR(150) | NOT NULL | Tên kho lưu trữ |
| `status` | VARCHAR(30) | NOT NULL | `ACTIVE`, `GRACE_PERIOD`, `PENDING_VERIFICATION`, `UNLOCKED`, `CLOSED` |
| `master_key_salt` | VARCHAR(255) | NOT NULL | Chuỗi salt phục vụ dẫn xuất khóa mã hóa tại client |
| `encrypted_master_key` | TEXT | NOT NULL | Khóa Master được mã hóa lưu trữ tạm |
| `created_at` | TIMESTAMP | NOT NULL | Thời gian tạo (UTC) |

### 5.2. Bảng `DigitalAssets` (Hồ sơ tài sản số)
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | Khóa chính |
| `vault_id` | UUID | FK, NOT NULL | Thuộc kho lưu trữ nào |
| `asset_category` | VARCHAR(50) | NOT NULL | `BANK_ACCOUNT`, `CRYPTO_WALLET`, `SOCIAL_MEDIA`, `LEGAL_DOCUMENT` |
| `title` | VARCHAR(200) | NOT NULL | Tên hiển thị công khai (Metadata) |
| `encrypted_payload` | TEXT | NOT NULL | Bản rõ thông tin bí mật đã được mã hóa AES-256 (Ciphertext) |
| `file_storage_path` | VARCHAR(500) | NULL | Đường dẫn file đính kèm trên Object Storage (đã mã hóa) |
| `assigned_beneficiary_id`| UUID | FK, NOT NULL | Tham chiếu tới người thụ hưởng được chỉ định |
| `claim_status` | VARCHAR(30) | NOT NULL | `UNCLAIMED`, `NOTIFIED`, `KYC_VERIFIED`, `DOWNLOADED`, `CONFIRMED` |

### 5.3. Bảng `DeadMansSwitchConfigs` (Cấu hình công tắc sinh tồn)
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | Khóa chính |
| `vault_id` | UUID | FK, UNIQUE | Liên kết 1-1 với Vault |
| `check_interval_days` | INT | NOT NULL | Chu kỳ kiểm tra định kỳ (ví dụ: 30 ngày) |
| `grace_period_days` | INT | NOT NULL | Thời gian ân hạn (ví dụ: 14 ngày) |
| `last_check_in_at` | TIMESTAMP | NOT NULL | Thời điểm phản hồi sinh tồn thành công gần nhất |
| `next_ping_due_at` | TIMESTAMP | NOT NULL | Hạn chót phải phản hồi lần tiếp theo |
| `consecutive_misses` | INT | DEFAULT 0 | Số lần không phản hồi liên tiếp |

### 5.4. Bảng `VerificationRequests` (Yêu cầu thẩm định pháp lý)
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK | Khóa chính |
| `vault_id` | UUID | FK, NOT NULL | Kho yêu cầu thẩm định |
| `executor_id` | UUID | FK, NOT NULL | Người thi hành nộp yêu cầu |
| `death_certificate_url`| VARCHAR(500) | NOT NULL | Đường dẫn file scan giấy chứng tử |
| `verifier_id` | UUID | FK, NULL | Legal Verifier tiếp nhận hồ sơ |
| `status` | VARCHAR(30) | NOT NULL | `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED` |
| `rejection_reason` | TEXT | NULL | Lý do nếu bị từ chối |
| `verifier_signature` | TEXT | NULL | Chữ ký số điện tử của Verifier khi Approved |
| `reviewed_at` | TIMESTAMP | NULL | Thời điểm ký duyệt phê chuẩn |

---

## 6. MA TRẬN TRUY VẾT & TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

| ID Kiểm thử | Yêu cầu liên quan | Kịch bản kiểm thử (Test Scenario) | Kết quả kỳ vọng (Expected Result) |
|---|---|---|---|
| **TC-SEC-01** | `FR-001`, `NFR-001` | Kiểm tra gói tin HTTP Request khi tạo tài sản mới qua Network Tab | Payload gửi lên server ở trường `encrypted_payload` là chuỗi Ciphertext; không tìm thấy mật khẩu/seed phrase gốc trong request hay DB. |
| **TC-DMS-01** | `FR-007`, `FR-008`, `BR-003` | Tài khoản đến hạn ping: Hệ thống gửi thông báo; người dùng bấm liên kết "Tôi vẫn ổn" | `last_check_in_at` cập nhật về thời điểm hiện tại; `next_ping_due_at` cộng thêm đúng số ngày trong `check_interval_days`. |
| **TC-DMS-02** | `FR-009`, `BR-008` | Quá hạn cả `check_interval` lẫn `grace_period` mà không có phản hồi | Trạng thái Vault tự động đổi sang `PENDING_VERIFICATION`; Email khẩn cấp được gửi thành công đến Digital Executor. |
| **TC-VER-01** | `FR-014`, `FR-016`, `BR-005` | Executor cố tình gọi API mở khóa kho khi chưa có chữ ký số của Legal Verifier | API chặn với mã lỗi `403 Forbidden`, thông báo lỗi yêu cầu biên bản pháp lý hợp lệ. |
| **TC-KYC-01** | `FR-019`, `FR-020`, `BR-006` | Beneficiary nhận thông báo, truy cập link tải khi chưa hoàn tất eKYC | Hệ thống chuyển hướng bắt buộc vào trang xác thực danh tính; không hiển thị khóa giải mã. |
| **TC-AUD-01** | `NFR-003`, `BR-007` | Thực hiện câu lệnh SQL `UPDATE` hoặc `DELETE` trực tiếp trên bảng `AuditLogs` | Hệ thống cơ sở dữ liệu từ chối thực thi và kích hoạt trigger cảnh báo an ninh. |

---

## 7. YÊU CẦU TRẢI NGHIỆM VÀ GIAO DIỆN NGƯỜI DÙNG (UI/UX)
* **UI-001 (Framework & Thư viện):** Giao diện phải được xây dựng đồng nhất bằng hệ thống Component của `react-bootstrap` kết hợp với hệ thống màu sắc (CSS Variables) quản lý tập trung. Hạn chế tối đa việc viết inline CSS hoặc dùng thẻ `div` không có ngữ nghĩa.
* **UI-002 (Giao diện Đa nền tảng - Responsive):** Sử dụng 100% Bootstrap Grid System để đảm bảo khả năng hiển thị tương thích trên cả Desktop, Tablet và Mobile.
* **UI-003 (Chế độ Sáng/Tối - Light/Dark Theme):** Hỗ trợ chuyển đổi giao diện Sáng/Tối (Theme Toggle). Giao diện tối (Dark mode) hướng tới sự hiện đại, bảo mật; trong khi giao diện sáng (Light mode) mang lại cảm giác thân thiện, rõ ràng. Các biến CSS (như `--lv-bg`, `--lv-text`) phải tự động điều chỉnh theo theme.
* **UI-004 (Điều hướng Cảm xúc - Semantic Colors):** Hệ thống phân loại thông báo rõ ràng theo màu: Đỏ (Nguy hiểm/Hết hạn), Vàng (Cảnh báo/Chờ duyệt), Xanh lá (Thành công/An toàn), Xanh dương (Thông tin chung).
* **UI-005 (Luồng Xác thực Mở rộng):** Cung cấp đầy đủ luồng tương tác người dùng cho các trường hợp: Đăng ký, Đăng nhập và Quên mật khẩu/Đặt lại mật khẩu trực quan.

---

## 8. LỘ TRÌNH NÂNG CẤP LÊN MÔI TRƯỜNG THỰC TẾ (PRODUCTION-READY ENHANCEMENTS)
Để đưa hệ thống từ mức độ Khả thi (MVP) lên Vận hành Thực tế (Production), các thành phần "giả lập" sau phải được thay thế và tích hợp:
1. **Dịch vụ Thông báo (Notifications):** Loại bỏ in log console, tích hợp `Nodemailer/SendGrid` cho Email và `Twilio/Stringee` cho SMS.
2. **Lưu trữ Đám mây (Object Storage):** Loại bỏ việc lưu file vào thư mục cục bộ (`./uploads`), chuyển sang API của AWS S3 hoặc Google Cloud Storage.
3. **Chữ ký số (Digital Signature):** Tích hợp với dịch vụ CA (Certificate Authority) như VNPT CA hoặc Viettel CA để Verifier ký số hợp lệ lên văn bản, thay vì chỉ cập nhật trạng thái trong Database.
4. **Định danh điện tử (eKYC):** Chuyển từ mock-service sang tích hợp SDK eKYC thực tế (nhận diện giấy tờ và liveness check của khuôn mặt).
5. **Xác thực Đa yếu tố (MFA):** Thiết lập cơ chế tạo QR Code và xác thực mã OTP ngẫu nhiên từ Google Authenticator hoặc Authy trước khi truy cập tài khoản.
6. **Mã hóa Cấu hình (Webhook Security):** Mã hóa đối xứng AES-256 các API Key (như SMS Key, eKYC Key) trước khi lưu vào cơ sở dữ liệu để chống rò rỉ cấu hình hệ thống.
