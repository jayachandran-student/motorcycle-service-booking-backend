import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { auth } from "../middleware/auth.js";
import Booking from "../models/Booking.js";

const router = express.Router();

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  // Don't throw here – log and let the route return a 500 gracefully
  console.error("❌ Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
}

/** Create an order (amount in paise) */
router.post("/order", auth("taker"), async (req, res) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment gateway not configured" });
    }

    const { amountInPaise, receipt } = req.body || {};
    const amount = Number(amountInPaise);

    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const razor = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const order = await razor.orders.create({
      amount, // in paise
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: { userId: req.user.id },
    });

    return res.json(order);
  } catch (err) {
    // Razorpay SDK sometimes rejects with a plain object, not Error
    const msg = err?.message || err?.error?.description || "Unable to create order";
    console.error("❌ /payments/order failed:", err);
    return res.status(500).json({ message: msg, detail: err });
  }
});

/** Verify signature and mark booking confirmed */
router.post("/verify", auth("taker"), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, user: req.user.id },
      { status: "confirmed", orderId: razorpay_order_id, paymentId: razorpay_payment_id },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.json(booking);
  } catch (err) {
    console.error("❌ /payments/verify failed:", err);
    return res.status(500).json({ message: err?.message || "Verification failed" });
  }
});

export default router;
