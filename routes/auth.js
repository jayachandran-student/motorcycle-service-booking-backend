import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const sign = (u) => jwt.sign({ id: u._id, role: u.role, name: u.name, email: u.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

router.post("/register", async (req,res)=>{
  const { name, email, password, role="taker" } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ message:"Email already used" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  res.json({ token: sign(user), user: { name:user.name, email:user.email, role:user.role }});
});

router.post("/login", async (req,res)=>{
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message:"Invalid credentials" });
  if (!await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ message:"Invalid credentials" });
  res.json({ token: sign(user), user: { name:user.name, email:user.email, role:user.role } });
});

router.get("/me", auth(), async (req,res)=>{
  const user = await User.findById(req.user.id).select("name email role");
  res.json({ user });
});

export default router;
