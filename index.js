import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

/* ---------- CORS setup ---------- */
const allowListExact = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_VITE,
  process.env.CLIENT_URL_PROD
].filter(Boolean);

const localhostRx = /^http:\/\/localhost(:\d+)?$/i;
const loopbackRx  = /^https?:\/\/127\.0\.0\.1(:\d+)?$/i;
const netlifyRx   = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i;

function norm(u) {
  return (u || "").replace(/\/+$/, "").toLowerCase();
}

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
  }
  if (origin.startsWith("file://") || localhostRx.test(origin) || loopbackRx.test(origin) || netlifyRx.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return next();
  }
  const ok = allowListExact.some((u) => norm(u) === norm(origin));
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return next();
  }
  return res.status(403).json({ message: "CORS blocked for origin" });
});

app.options("*", (req, res) => {
  const origin = req.get("Origin") || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  return res.sendStatus(204);
});

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

/* ---------- Health check ---------- */
app.get("/", (_req, res) => res.send("API running 🚀"));

/* ---------- Routes ---------- */
const { default: authRoutes } = await import("./routes/auth.js");
const { default: motorcyclesRoutes } = await import("./routes/motorcycles.js");
const { default: vehiclesRoutes } = await import("./routes/vehicles.js"); 
const { default: bookingsRoutes } = await import("./routes/bookings.js");
const { default: paymentsRoutes } = await import("./routes/payments.js");
const { default: reviewsRoutes } = await import("./routes/reviews.js");

app.use("/api/auth", authRoutes);
app.use("/api/motorcycles", motorcyclesRoutes);
app.use("/api/vehicles", vehiclesRoutes); 
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reviews", reviewsRoutes);

/* ---------- Error handler ---------- */
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
