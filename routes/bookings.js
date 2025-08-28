import express from "express";
import Booking from "../models/Booking.js";
import Motorcycle from "../models/Motorcycle.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/** Create a booking (initially "pending") */
router.post("/", auth("taker"), async (req, res) => {
  try {
    const { motorcycleId, startDate, endDate, totalPrice, orderId } = req.body;

    const mc = await Motorcycle.findById(motorcycleId);
    if (!mc) return res.status(404).json({ message: "Motorcycle not found" });

    const booking = await Booking.create({
      user: req.user.id,
      motorcycle: mc._id,
      startDate,
      endDate,
      totalPrice,
      orderId,
      status: "pending",
    });

    res.json(booking);
  } catch (e) {
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
