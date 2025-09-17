import express from "express";
import Booking from "../models/Booking.js";
import Motorcycle from "../models/Motorcycle.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/** Create a booking */
router.post("/", auth("taker"), async (req, res) => {
  try {
    const { motorcycleId, startDate, endDate } = req.body;
    if (!motorcycleId || !startDate || !endDate) {
      return res.status(400).json({ message: "motorcycleId, startDate, and endDate required" });
    }

    const mc = await Motorcycle.findById(motorcycleId);
    if (!mc) return res.status(404).json({ message: "Motorcycle not found" });

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return res.status(400).json({ message: "Invalid dates" });
    if (e <= s) return res.status(400).json({ message: "endDate must be after startDate" });

    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    const totalPrice = (mc.rentPerDay || 0) * days;

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
    console.error("Booking error:", e.message);
    res.status(500).json({ message: e.message || "Unable to create booking" });
  }
});


/** Get current user's bookings (taker) */
router.get("/mine", auth("taker"), async (req, res) => {
  try {
    const list = await Booking.find({ user: req.user.id }).populate("motorcycle");
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message || "Unable to fetch bookings" });
  }
});

/** Update (e.g., mark failed) */
router.put("/:id", auth("taker"), async (req, res) => {
  try {
    const { status } = req.body || {};
    const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!b) return res.status(404).json({ message: "Booking not found" });

    if (status) b.status = status;
    await b.save();
    res.json(b);
  } catch (e) {
    res.status(500).json({ message: e.message || "Unable to update booking" });
  }
});

/** Soft-cancel (keep history for analytics) */
router.delete("/:id", auth("taker"), async (req, res) => {
  try {
    const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!b) return res.status(404).json({ message: "Booking not found" });

    if (b.status === "confirmed")
      return res.status(400).json({ message: "Cannot cancel a confirmed booking" });

    if (b.status === "cancelled")
      return res.status(400).json({ message: "Booking already cancelled" });

    b.status = "cancelled";
    await b.save();

    res.json({ success: true, booking: b });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to cancel booking" });
  }
});

/** Lister: bookings for my vehicles */
router.get("/for-my-vehicles", auth("lister"), async (req, res) => {
  try {
    const list = await Booking.find()
      .populate({
        path: "motorcycle",
        match: { owner: req.user.id },
      })
      .populate("user", "name email");
    res.json(list.filter((x) => x.motorcycle));
  } catch (e) {
    res.status(500).json({ message: e.message || "Unable to fetch bookings" });
  }
});

export default router;
