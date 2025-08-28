import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /reviews?motorcycleId=<id>&limit=20
 * Returns latest reviews for a motorcycle.
 */
router.get("/", async (req, res) => {
  try {
    const { motorcycleId, limit } = req.query;

    const q = {};
    if (motorcycleId) {
      if (!mongoose.isValidObjectId(motorcycleId)) {
        // Bad id -> return empty list (frontend expects [])
        return res.json([]);
      }
      q.motorcycle = new mongoose.Types.ObjectId(motorcycleId);
    }

    const max = Math.min(Number(limit) || 20, 50);

    const reviews = await Review.find(q)
      .sort({ createdAt: -1 })
      .limit(max)
      .select("rating comment createdAt user motorcycle")
      .populate("user", "name");

    res.json(reviews);
  } catch (e) {
    console.error("GET /reviews error:", e);
    res.status(500).json({ message: e.message || "Unable to fetch reviews" });
  }
});

/**
 * ⭐ NEW: GET /reviews/summary?motorcycleId=<id>
 * Returns { avg, count } for the motorcycle's ratings.
 */
router.get("/summary", async (req, res) => {
  try {
    const { motorcycleId } = req.query;
    if (!motorcycleId || !mongoose.isValidObjectId(motorcycleId)) {
      return res.json({ avg: 0, count: 0 });
    }

    const [result] = await Review.aggregate([
      { $match: { motorcycle: new mongoose.Types.ObjectId(motorcycleId) } },
      { $group: { _id: "$motorcycle", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    res.json({
      avg: result ? Number(result.avg.toFixed(1)) : 0,
      count: result ? result.count : 0,
    });
  } catch (e) {
    console.error("GET /reviews/summary error:", e);
    res.status(500).json({ message: e.message || "Unable to summarize reviews" });
  }
});

/**
 * POST /reviews
 * Body: { bookingId, rating (1..5), comment }
 * Rules:
 *  - User must own the booking
 *  - Booking must be confirmed
 *  - One review per booking per user
 *  - Review tied to the booking's motorcycle
 */
router.post("/", auth("taker"), async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body || {};

    if (
      !bookingId ||
      !mongoose.isValidObjectId(bookingId) ||
      !rating ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({ message: "Invalid review payload" });
    }

    const b = await Booking.findById(bookingId);
    if (!b) return res.status(404).json({ message: "Booking not found" });

    if (String(b.user) !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    if (b.status !== "confirmed") {
      return res
        .status(400)
        .json({ message: "Only confirmed bookings can be reviewed" });
    }

    // Prevent duplicate review for the same booking by the same user
    const exists = await Review.findOne({ booking: b._id, user: req.user.id });
    if (exists) {
      return res
        .status(400)
        .json({ message: "You already reviewed this booking" });
    }

    const r = await Review.create({
      booking: b._id,
      motorcycle: b.motorcycle,
      user: req.user.id,
      rating: Number(rating),
      comment: comment || "",
    });

    res.status(201).json(r);
  } catch (e) {
    console.error("POST /reviews error:", e);
    res.status(500).json({ message: e.message || "Unable to submit review" });
  }
});

export default router;
