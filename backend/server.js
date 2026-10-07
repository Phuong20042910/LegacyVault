require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const connectDB = require("./src/config/db");
const routes = require("./src/routes");
const { apiLimiter } = require("./src/middleware/rateLimiter");
const { auditMiddleware } = require("./src/middleware/auditLogger");
const { initDmsScheduler } = require("./src/services/dmsScheduler");
const setupSwagger = require("./src/config/swagger");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Database ─────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8443",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000", // Allow Swagger UI
  "http://127.0.0.1:5000",
  "http://127.0.0.1:8443",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép nếu không có origin (như curl, postman) hoặc nằm trong danh sách
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin bị chặn: ${origin}`);
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Request Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Rate Limiting ────────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ─── Audit Middleware (attaches req.audit) ────────────────────────
app.use(auditMiddleware);

// ─── Static Files — Uploads ───────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// NOTE: uploads are NOT served statically for security — use download endpoints
// app.use("/uploads", express.static(uploadDir));

// ─── API Routes ───────────────────────────────────────────────────
setupSwagger(app);
app.use("/api", routes);

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "LegacyVault API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Error]", err.stack || err.message);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `Giá trị '${field}' đã tồn tại.` });
  }
  if (err.message === "CORS policy violation") {
    return res.status(403).json({ success: false, message: "Không được phép truy cập từ nguồn này." });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Lỗi máy chủ nội bộ." : err.message,
  });
});

// ─── Start Server ────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🔐 LegacyVault API Server            ║
  ║   Port: ${PORT}                           ║
  ║   Env:  ${process.env.NODE_ENV || "development"}                    ║
  ╚════════════════════════════════════════╝
  `);

  // Initialize Dead Man's Switch scheduler
  initDmsScheduler();
});

// ─── Graceful Shutdown ────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
