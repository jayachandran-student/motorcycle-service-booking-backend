import express from "express";
import Booking from "../models/Booking.js";
import Motorcycle from "../models/Motorcycle.js";
import Vehicle from "../models/Vehicle.js"; // optional: if present
import { auth } from "../middleware/auth.js";

const router = express.Router();

/** Create a booking */
router.post("/", auth("taker"), async (req, res) => {
  try {
    // accept either motorcycleId (old name) or vehicleId (new name)
    const { motorcycleId, vehicleId, startDate, endDate } = req.body;
    const id = motorcycleId || vehicleId;

    if (!id || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "motorcycleId/vehicleId, startDate, and endDate required" });
    }

    console.log("[bookings] create received id:", id);

    // try Motorcycle model first, then Vehicle fallback (some deployments use different model names)
    let mc = null;
    try {
      mc = await Motorcycle.findById(id);
    } catch (err) {
      console.warn("[bookings] Motorcycle.findById error:", err?.message || err);
    }

    if (!mc && typeof Vehicle !== "undefined") {
      try {
        mc = await Vehicle.findById(id);
      } catch (err) {
        console.warn("[bookings] Vehicle.findById error:", err?.message || err);
      }
    }

    if (!mc) {
      console.warn("[bookings] vehicle not found for id:", id);
      return res.status(404).json({ message: "Motorcycle not found" });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return res.status(400).json({ message: "Invalid dates" });
    if (e <= s) return res.status(400).json({ message: "endDate must be after startDate" });

    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    const perDay = Number(mc.rentPerDay ?? mc.pricePerDay ?? mc.price ?? 0);
    const totalPrice = perDay * days;

    const booking = await Booking.create({
      user: req.user.id,
      motorcycle: mc._id,
      startDate: s,
      endDate: e,
      totalPrice,
      status: "pending",
    });

    res.status(201).json(booking);
  } catch (e) {
    console.error("Booking error:", e);
    res.status(500).json({ message: e.message || "Unable to create booking" });
  }
});

/** Get current user's bookings (taker) */
router.get("/mine", auth("taker"), async (req, res) => {
  try {
    const list = await Booking.find({ user: req.user.id }).populate("motorcycle");
    res.json(list);
  } catch (e) {
    console.error("Fetch mine error:", e);
    res.status(500).json({ message: e.message || "Unable to fetch bookings" });
  }
});

/** Get single booking */
router.get("/:id", auth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("motorcycle").populate("user", "name email");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (req.user.role === "taker" && String(booking.user._id || booking.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.user.role === "lister") {
      const ownerId = booking.motorcycle?.owner || booking.motorcycle?.owner?._id;
      if (ownerId && String(ownerId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(booking);
  } catch (e) {
    console.error("Get booking error:", e);
    res.status(500).json({ message: e.message || "Unable to fetch booking" });
  }
});

/** Update (taker) */
router.put("/:id", auth("taker"), async (req, res) => {
  try {
    const { status } = req.body || {};
    const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!b) return res.status(404).json({ message: "Booking not found" });

    if (status) b.status = status;
    await b.save();
    res.json(b);
  } catch (e) {
    console.error("Update booking error:", e);
    res.status(500).json({ message: e.message || "Unable to update booking" });
  }
});

/** Cancel */
router.delete("/:id", auth("taker"), async (req, res) => {
  try {
    const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!b) return res.status(404).json({ message: "Booking not found" });

    if (b.status === "confirmed") return res.status(400).json({ message: "Cannot cancel a confirmed booking" });
    if (b.status === "cancelled") return res.status(400).json({ message: "Booking already cancelled" });

    b.status = "cancelled";
    await b.save();

    res.json({ success: true, booking: b });
  } catch (e) {
    console.error("Cancel booking error:", e);
    res.status(500).json({ message: e.message || "Failed to cancel booking" });
  }
});

/** Lister: bookings for my vehicles */
router.get("/for-my-vehicles", auth("lister"), async (req, res) => {
  try {
    const list = await Booking.find()
      .populate({ path: "motorcycle", match: { owner: req.user.id } })
      .populate("user", "name email");
    res.json(list.filter((x) => x.motorcycle));
  } catch (e) {
    console.error("For-my-vehicles error:", e);
    res.status(500).json({ message: e.message || "Unable to fetch bookings" });
  }
});

export default router;
