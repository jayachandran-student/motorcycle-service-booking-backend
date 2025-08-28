import express from "express";
import Motorcycle from "../models/Motorcycle.js";
import { auth } from "../middleware/auth.js";
const router = express.Router();

router.get("/", async (_, res) => {
  const list = await Motorcycle.find({ available:true }).sort("-createdAt");
  res.json(list);
});

router.get("/mine", auth("lister"), async (req, res) => {
  const list = await Motorcycle.find({ owner: req.user.id });
  res.json(list);
});

router.post("/", auth("lister"), async (req, res) => {
  const created = await Motorcycle.create({ ...req.body, owner: req.user.id });
  res.json(created);
});

export default router;
