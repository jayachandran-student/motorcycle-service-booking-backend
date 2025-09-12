import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const sign = (u) =>
  jwt.sign(
    { id: u._id, role: u.role, name: u.name, email: u.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );

// Helper: set cookie with proper options for production vs local dev
function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,                         // secure=true on HTTPS in production
    sameSite: isProd ? "none" : "lax",      // none in production so cross-site works
    maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 days
  };
  res.cookie("token", token, cookieOptions);
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "taker" } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });

    const token = sign(user);
    setAuthCookie(res, token);
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!(await bcrypt.compare(password, user.passwordHash)))
      return res.status(400).json({ message: "Invalid credentials" });

    const token = sign(user);
    setAuthCookie(res, token);
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    res.json({ user });
  } catch (err) {
    console.error("Me route error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
