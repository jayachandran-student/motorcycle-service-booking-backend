// index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"; // helpful to parse cookies in requests

const app = express();


const allowListExact = [
  process.env.CLIENT_URL,       // e.g. http://localhost:3000
  process.env.CLIENT_URL_VITE,  // e.g. http://localhost:5173
  process.env.CLIENT_URL_PROD   // e.g. https://motorcyclebookingapp.netlify.app
].filter(Boolean);

const localhostRx = /^http:\/\/localhost(:\d+)?$/i;
const loopbackRx  = /^https?:\/\/127\.0\.0\.1(:\d+)?$/i;
const netlifyRx   = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i;

function norm(u) {
  return (u || "").replace(/\/+$/, "").toLowerCase();
}

// small debug - optional
app.use((req, res, next) => {
  res.setHeader("X-CORS-Debug", "1");
  next();
});

app.use((req, res, next) => {
  const origin = req.get("Origin");
  console.log("CORS: incoming origin =", origin);

  if (!origin) {
    // non-browser clients (curl/postman)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Vary", "Origin");
    return next();
  }

  // file:// or local dev
  if (origin.startsWith("file://") || localhostRx.test(origin) || loopbackRx.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    return next();
  }

  // allow any netlify subdomain
  if (netlifyRx.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    return next();
  }

  // exact env list match
  const ok = allowListExact.some((u) => norm(u) === norm(origin));
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    return next();
  }

  console.warn("CORS: blocked origin:", origin);
  res.setHeader("Vary", "Origin");
  return res.status(403).json({ message: "CORS blocked for origin" });
});

// central preflight answer
app.options("*", (req, res) => {
  const origin = req.get("Origin") || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Vary", "Origin");
  return res.sendStatus(204);
});

/* ---------- Standard middleware ---------- */
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

/* ---------- Health ---------- */
app.get("/", (_req, res) => res.send("API running 🚀"));

/* ---------- Routes (import AFTER env loaded) ---------- */
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
