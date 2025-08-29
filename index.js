// index.js
import dotenv from "dotenv";
dotenv.config(); // load env first

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

const app = express();

/* ---------- CORS (robust + preflight-safe) ---------- */
const allowListExact = [
  process.env.CLIENT_URL,        // http://localhost:3000
  process.env.CLIENT_URL_VITE,   // http://localhost:5173
  process.env.CLIENT_URL_PROD,   // e.g. https://motorcyclebook.netlify.app  (no trailing slash)
].filter(Boolean);

// Generic patterns we allow
const localhostRx = /^http:\/\/localhost(:\d+)?$/i;
const loopbackRx  = /^https?:\/\/127\.0\.0\.1(:\d+)?$/i;
// Optional convenience: allow any Netlify subdomain (remove if you want only exact site)
const netlifyRx   = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i;

// Normalize URL for case/ending-slash-insensitive compare
const norm = (u) => (u || "").replace(/\/+$/, "").toLowerCase();

app.use(
  cors({
    origin(origin, cb) {
      // Debug log (comment out once stable)
      console.log("CORS: request Origin =", origin);

      // No Origin -> curl/Postman/server-to-server; allow
      if (!origin) return cb(null, true);

      // Local contexts
      if (origin.startsWith("file://")) return cb(null, true);
      if (localhostRx.test(origin) || loopbackRx.test(origin)) return cb(null, true);

      // Any *.netlify.app (handy during site renames)
      if (netlifyRx.test(origin)) return cb(null, true);

      // Exact allow list from env
      const ok = allowListExact.some((u) => norm(u) === norm(origin));
      if (ok) return cb(null, true);

      console.warn("CORS blocked for origin:", origin);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Always answer preflights cleanly with the needed headers
app.options("*", (req, res) => {
  const origin = req.get("Origin");
  if (origin) res.set("Access-Control-Allow-Origin", origin);
  else res.set("Access-Control-Allow-Origin", "*");
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  return res.sendStatus(204);
});

app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

/* ---------- Health ---------- */
app.get("/", (_req, res) => res.send("API running 🚀"));

/* ---------- Routes (import AFTER env is loaded) ---------- */
const { default: authRoutes } = await import("./routes/auth.js");
const { default: motorcyclesRoutes } = await import("./routes/motorcycles.js");
const { default: bookingsRoutes } = await import("./routes/bookings.js");
const { default: paymentsRoutes } = await import("./routes/payments.js");
const { default: reviewsRoutes } = await import("./routes/reviews.js");

app.use("/api/auth", authRoutes);
app.use("/api/motorcycles", motorcyclesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reviews", reviewsRoutes);

/* ---------- Global error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err?.message || err);
  res.status(err.status || 500).json({ message: err?.message || "Server error" });
});

/* ---------- DB & Server ---------- */
const PORT = Number(process.env.PORT) || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 API running on ${PORT}`));
  })
  .catch((err) => console.error("❌ Mongo error:", err.message));

process.on("unhandledRejection", (r) => console.error("🔴 UnhandledRejection:", r));
process.on("uncaughtException", (e) => console.error("🔴 UncaughtException:", e));
