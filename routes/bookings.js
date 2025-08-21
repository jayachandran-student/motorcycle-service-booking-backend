import express from "express";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new booking (Protected)
router.post("/create", protect, async (req, res) => {
  try {
    const { vehicle, date } = req.body;

    const newBooking = new Booking({
      vehicle,
      date,
      user: req.user.id, // comes from JWT middleware
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ message: "Error creating booking", error: err.message });
  }
});

// Get all bookings for logged-in user (Protected)
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
});

export default router;
