// index.js
import dotenv from "dotenv";
dotenv.config(); // ✅ load env BEFORE anything else

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

const app = express();

/* ---------- CORS ---------- */
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",        // CRA
  process.env.CLIENT_URL_VITE || "http://localhost:5173",   // Vite
  process.env.CLIENT_URL_PROD || ""                         // Netlify
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS blocked")),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

/* ---------- DB ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 API running on ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ Mongo error:", err.message));

/* ---------- Health ---------- */
app.get("/", (_req, res) => res.send("API running 🚀"));

/* ---------- Routes (import AFTER env is loaded) ---------- */
// Top-level await ensures env vars are available to route modules at load time
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
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({ message: err?.message || "Server error" });
});

/* ---------- Process-level safety nets ---------- */
process.on("unhandledRejection", (reason) => {
  console.error("🔴 UnhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔴 UncaughtException:", err);
});
