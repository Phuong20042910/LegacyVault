import { Container, Card, Badge, Button, Row, Col } from "react-bootstrap";

const docs = [
  { name: "Di chúc số v2.1", type: "Di chúc", size: "2.4 MB", uploaded: "05/09/2026", signed: true },
  { name: "Giấy tờ sở hữu nhà đất", type: "Bất động sản", size: "8.1 MB", uploaded: "01/08/2026", signed: true },
  { name: "Hợp đồng ủy quyền toàn phần", type: "Pháp lý", size: "1.8 MB", uploaded: "15/07/2026", signed: true },
  { name: "Danh sách tài khoản ngân hàng", type: "Tài chính", size: "512 KB", uploaded: "10/06/2026", signed: false },
  { name: "Hướng dẫn bàn giao crypto", type: "Hướng dẫn", size: "340 KB", uploaded: "01/06/2026", signed: false },
];

export default function OwnerDocuments() {
  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Tài liệu pháp lý</h1>
          <p className="text-muted mb-0">Tài liệu được mã hóa đầu-cuối và lưu trữ an toàn</p>
        </div>
        <label className="btn btn-warning fw-bold px-4 mb-0 cursor-pointer d-flex align-items-center gap-2">
          + Tải lên tài liệu
          <input type="file" className="d-none" />
        </label>
      </div>

      {/* Drop zone */}
      <Card className="text-center py-5 border-dashed shadow-sm mb-4 bg-light">
        <Card.Body className="d-flex flex-column align-items-center">
          <div className="bg-white rounded d-flex align-items-center justify-content-center shadow-sm mb-3" style={{ width: 64, height: 64, fontSize: 32 }}>
            📄
          </div>
          <Card.Title className="fw-bold fs-5 mb-1">Kéo thả tài liệu vào đây</Card.Title>
          <Card.Text className="text-muted font-monospace small">
            PDF, DOCX, JPG &middot; Tối đa 50MB &middot; Mã hóa AES-256 tự động
          </Card.Text>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light border-bottom font-monospace text-uppercase text-muted d-flex justify-content-between py-3">
          <span>{docs.length} tài liệu &middot; {docs.filter(d => d.signed).length} đã ký số</span>
        </Card.Header>
        <div className="list-group list-group-flush">
          {docs.map((doc, idx) => (
            <div key={idx} className="list-group-item list-group-item-action d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-3 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, fontSize: 24 }}>
                  📄
                </div>
                <div>
                  <div className="fw-bold text-dark">{doc.name}</div>
                  <div className="font-monospace text-muted small mt-1">
                    {doc.type} &middot; {doc.size} &middot; {doc.uploaded}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 justify-content-between w-100 w-md-auto">
                <Badge bg={doc.signed ? "success" : "warning"} text={doc.signed ? "white" : "dark"} className="border py-2 px-3 fw-normal font-monospace">
                  {doc.signed ? "✓ Đã ký số" : "○ Chưa ký"}
                </Badge>
                <div className="d-flex gap-2">
                  <Button variant="link" className="text-warning text-decoration-none fw-bold p-0 font-monospace small">Tải xuống</Button>
                  <Button variant="link" className="text-danger text-decoration-none fw-bold p-0 font-monospace small">Xóa</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Container>
  );
}
