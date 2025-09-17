import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function sign(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    // cross-site cookies: in prod we use 'none' (with secure), local dev uses 'lax'
    sameSite: isProd ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
  };
  res.cookie(COOKIE_NAME, token, cookieOptions);
}

/**
 * Register
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "taker" } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "name, email and password required" });

    const emailNorm = email.toLowerCase();
    if (await User.findOne({ email: emailNorm })) return res.status(400).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "lister" ? "lister" : "taker";

    const user = await User.create({ name, email: emailNorm, passwordHash, role: userRole });

    const token = sign(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = sign(user);
    setAuthCookie(res, token);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.json({ success: true });
});


router.get("/me", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error("Me route error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
