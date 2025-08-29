// backend/routes/payments.js
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/* ---------- Guard against missing env ---------- */
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    "[payments] Razorpay keys missing! Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render env."
  );
}

/* ---------- Razorpay instance ---------- */
const razor = new Razorpay({
  key_id: RAZORPAY_KEY_ID || "missing",
  key_secret: RAZORPAY_KEY_SECRET || "missing",
});

/* ---------- Create order ---------- */
router.post("/order", auth("taker"), async (req, res) => {
  try {
    const { amountInPaise, receipt } = req.body;
    if (!amountInPaise || amountInPaise < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Number(amountInPaise),
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    console.log("[payments] creating order:", options);

    const order = await razor.orders.create(options);
    console.log("[payments] order created:", order.id);

    res.json(order);
  } catch (err) {
    console.error("[payments] order create error:", err);
    res.status(500).json({
      message: err?.error?.description || err.message || "Could not create order",
    });
  }
});

/* ---------- Verify payment & confirm booking ---------- */
router.post("/verify", auth("taker"), async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay fields" });
    }
    if (!bookingId) return res.status(400).json({ message: "Missing bookingId" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    console.log("[payments] verify:", {
      order: razorpay_order_id,
      pay: razorpay_payment_id,
      isValid,
    });

    if (!isValid) return res.status(400).json({ message: "Invalid signature" });

    // Mark booking as confirmed
    const b = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
    });

    if (!b) return res.status(404).json({ message: "Booking not found" });

    b.status = "confirmed";
    b.paymentId = razorpay_payment_id;
    await b.save();

    console.log("[payments] booking confirmed:", b._id);
    res.json({ success: true, booking: b });
  } catch (err) {
    console.error("[payments] verify error:", err);
    res.status(500).json({ message: err.message || "Verification failed" });
  }
});

export default router;
