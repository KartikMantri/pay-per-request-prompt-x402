/**
 * x402 AI Gateway - Main Server
 *
 * This is the entry point for the backend API.
 * It serves as an AI gateway with x402 payment verification.
 *
 * ARCHITECTURE:
 * ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 * │   Frontend  │────▶│   Backend   │────▶│   Gemini    │
 * │   (React)   │     │  (Express)  │     │   (AI)      │
 * └─────────────┘     └──────┬──────┘     └─────────────┘
 *                            │
 *                     ┌──────▼──────┐
 *                     │   Monad     │
 *                     │ (Payments)  │
 *                     └─────────────┘
 */
import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config.js";
import { initBlockchain } from "./services/blockchain.js";
import { initGemini } from "./services/gemini.js";
import { initX402Payment } from "./services/x402PaymentModule.js";
import aiRoutes from "./routes/ai.js";

const app = express();

// ═══════════════════════════════════════════════════════════════
//                        MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// CORS - allow frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".railway.app") ||
        origin.endsWith(".nodeops.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// JSON body parser
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════════
//                          ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "x402-ai-gateway",
    timestamp: Date.now(),
  });
});

// API info
app.get("/", (req, res) => {
  res.json({
    name: "x402 AI Access Gateway",
    version: "1.0.0",
    description: "Wallet-native AI monetization on Monad",

    endpoints: {
      "/api/ai/generate": "POST - Generate AI response (x402 verified)",
      "/api/ai/pricing": "GET - Get pricing info",
      "/api/ai/access/:address": "GET - Check access status",
      "/api/ai/providers": "GET - List providers and capabilities",
    },

    x402: {
      description: "Payment Required responses use HTTP 402",
      flow: [
        "1. Send request to /api/ai/generate",
        "2. If no access, receive 402 with payment options",
        "3. Pay via smart contract on Monad",
        "4. Retry request with requestId",
      ],
    },

    network: {
      name: "Monad Testnet",
      chainId: config.chainId,
      rpc: config.monadRpcUrl,
    },
  });
});

// AI routes
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// ═══════════════════════════════════════════════════════════════
//                        STARTUP / EXPORT
// ═══════════════════════════════════════════════════════════════

async function start() {
  console.log("\n🚀 x402 AI Gateway Starting...\n");

  // Validate config
  validateConfig();

  // Initialize services
  initBlockchain();
  initGemini();
  initX402Payment(); // Initialize production x402 payment system

  // Start server (only if not running on Vercel)
  if (!process.env.VERCEL) {
    app.listen(config.port, "0.0.0.0", () => {
      console.log(`\n✅ Server running on port ${config.port}`);
      console.log(`📡 Monad RPC: ${config.monadRpcUrl}`);
      console.log(`📝 Contract: ${config.contractAddress || "Not configured"}`);
      console.log(
        "\n═══════════════════════════════════════════════════════════════",
      );
      console.log("                     x402 AI GATEWAY READY");
      console.log(
        "═══════════════════════════════════════════════════════════════\n",
      );
    });
  } else {
    console.log("☁️ Running in Vercel Serverless environment");
  }
}

// In serverless environments, we still need to initialize services
if (process.env.VERCEL) {
  // We can't use await at top level in some Node versions,
  // but these are mostly synchronous or handle their own promises
  validateConfig();
  initBlockchain();
  initGemini();
  initX402Payment();
} else {
  // Normal local startup
  start().catch(console.error);
}

export default app;
