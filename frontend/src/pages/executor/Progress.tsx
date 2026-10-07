import { Container, Card, Badge, ProgressBar } from "react-bootstrap";

const steps = [
  { label: "Dead Man's Switch kích hoạt", date: "09/08/2026", done: true },
  { label: "Thông báo gửi tới người thi hành", date: "09/08/2026", done: true },
  { label: "Yêu cầu xác minh giấy chứng tử nộp", date: "12/09/2026", done: true },
  { label: "Người xác minh pháp lý phê duyệt", date: "Đang chờ xử lý...", done: false, active: true },
  { label: "Kho lưu trữ được mở khóa", date: "—", done: false },
  { label: "Thông báo tới người thụ hưởng", date: "—", done: false },
  { label: "Bàn giao tài sản hoàn tất", date: "—", done: false },
];

export default function ExecutorProgress() {
  const doneCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((doneCount / steps.length) * 100);

  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase text-primary small fw-bold">Theo dõi trạng thái</span>
        </div>
        <h1 className="fw-bold mb-2">Tiến độ bàn giao di sản</h1>
        <p className="text-muted mb-0">
          Theo dõi sát sao từng bước trong quy trình mở khóa và chuyển giao tài sản số. Mọi bước tiến đều được lưu vết trên hệ thống.
        </p>
      </div>

      <Card className="shadow-sm border-0 mb-4 bg-light">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32 }}>
                📈
              </div>
              <h5 className="fw-bold mb-0">Tiến trình tổng thể</h5>
            </div>
            <h4 className="fw-bold text-primary mb-0">{progressPercent}%</h4>
          </div>
          
          <ProgressBar now={progressPercent} variant="primary" className="mb-2" style={{ height: '12px' }} />
          
          <div className="text-end font-monospace small text-muted text-uppercase mt-2">
            HOÀN THÀNH {doneCount} TRÊN TỔNG SỐ {steps.length} BƯỚC
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-column gap-3">
            {steps.map((step, i) => (
              <div key={i} className="d-flex gap-4 align-items-start">
                <div className="d-flex flex-column align-items-center flex-shrink-0 mt-1">
                  <div
                    className={`d-flex align-items-center justify-content-center rounded-circle fw-bold ${step.done ? 'bg-primary text-white' : step.active ? 'bg-primary bg-opacity-25 text-primary border border-primary' : 'bg-light text-muted border'}`}
                    style={{ width: 40, height: 40 }}
                  >
                    {step.done ? "✓" : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`my-2 ${step.done ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`} style={{ width: 2, minHeight: 40 }} />
                  )}
                </div>
                <div className="pb-3 flex-grow-1">
                  <div className={`fw-bold fs-5 mb-1 ${step.done ? 'text-dark' : step.active ? 'text-primary' : 'text-muted'}`}>
                    {step.label}
                  </div>
                  <div className={`font-monospace small d-flex align-items-center gap-2 ${step.done ? 'text-muted' : step.active ? 'text-primary' : 'text-muted opacity-50'}`}>
                    {step.active && <span className="bg-primary rounded-circle" style={{ width: 8, height: 8 }} />}
                    {step.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
