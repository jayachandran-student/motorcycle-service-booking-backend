import express from "express";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Create a vehicle (Lister only)
 * POST /api/vehicles
 */
router.post("/", auth("lister"), async (req, res) => {
  try {
    const { title, brand, model, year, rentPerDay, description, images, available } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const vehicle = new Vehicle({
      owner: req.user.id,
      title,
      brand,
      model,
      year,
      rentPerDay,
      description,
      images: Array.isArray(images) ? images : [],
      available: typeof available === "boolean" ? available : true,
    });

    await vehicle.save();
    return res.status(201).json(vehicle);
  } catch (e) {
    console.error("Create vehicle error:", e);
    return res.status(500).json({ message: e?.message || "Unable to create vehicle" });
  }
});

/**
 * Public: list available vehicles
 * GET /api/vehicles
 */
router.get("/", async (req, res) => {
  try {
    const list = await Vehicle.find({ available: true }).populate("owner", "name email");
    return res.json(list);
  } catch (e) {
    console.error("List vehicles error:", e);
    return res.status(500).json({ message: e?.message || "Unable to list vehicles" });
  }
});

/**
 * Lister: get my vehicles
 * GET /api/vehicles/mine
 * <-- IMPORTANT: defined before /:id so "mine" is not treated as an id
 */
router.get("/mine", auth("lister"), async (req, res) => {
  try {
    console.log("MINE called — req.user:", req.user?.id);
    const list = await Vehicle.find({ owner: req.user.id });
    return res.json(list);
  } catch (e) {
    console.error("My vehicles error:", e);
    return res.status(500).json({ message: e?.message || "Unable to fetch vehicles" });
  }
});

/**
 * Get single vehicle by id
 * GET /api/vehicles/:id
 * (declared after /mine)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const vehicle = await Vehicle.findById(id).populate("owner", "name email");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(vehicle);
  } catch (e) {
    console.error("Get vehicle error:", e);
    return res.status(500).json({ message: e?.message || "Unable to fetch vehicle" });
  }
});

/**
 * Update vehicle (owner only)
 * PUT /api/vehicles/:id
 */
router.put("/:id", auth("lister"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (vehicle.owner.toString() !== req.user.id.toString()) return res.status(403).json({ message: "Forbidden" });

    const updatable = ["title", "brand", "model", "year", "rentPerDay", "description", "images", "available"];
    updatable.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) vehicle[k] = req.body[k];
    });

    await vehicle.save();
    return res.json(vehicle);
  } catch (e) {
    console.error("Update vehicle error:", e);
    return res.status(500).json({ message: e?.message || "Unable to update vehicle" });
  }
});

/**
 * Delete vehicle (owner only)
 * DELETE /api/vehicles/:id
 */
router.delete("/:id", auth("lister"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (vehicle.owner.toString() !== req.user.id.toString()) return res.status(403).json({ message: "Forbidden" });

    await vehicle.remove();
    return res.json({ success: true });
  } catch (e) {
    console.error("Delete vehicle error:", e);
    return res.status(500).json({ message: e?.message || "Unable to delete vehicle" });
  }
});

export default router;
