import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

// Warn early if missing
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error(
    "[payments] Razorpay keys missing in environment! Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
  );
}

// Create Razorpay instance (keep using sdk)
const razor = new Razorpay({
  key_id: RAZORPAY_KEY_ID || "missing",
  key_secret: RAZORPAY_KEY_SECRET || "missing",
});

/* ---------- Create order ---------- */
router.post("/order", auth("taker"), async (req, res) => {
  try {
    // Refuse to proceed if keys are not configured
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("[payments] aborting order create: keys missing");
      return res.status(500).json({
        message: "Razorpay keys not configured on server. Contact admin.",
      });
    }

    const { amountInPaise, receipt } = req.body;
    if (!amountInPaise || Number(amountInPaise) < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Number(amountInPaise),
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    // Safe debug: show partial key_id so you can verify which key the server uses (never print secret)
    console.log(
      "[payments] creating order; using key_id preview:",
      RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.slice(0, 8)}...` : "missing"
    );
    console.log("[payments] order options:", options);

    const order = await razor.orders.create(options);

    console.log("[payments] order created:", order.id);
    return res.json(order);
  } catch (err) {
    // Log helpful debug info without leaking secrets
    console.error("[payments] order create error:", err?.message || err);
    if (err?.statusCode) {
      console.error("[payments] razorpay statusCode:", err.statusCode);
    }
    if (err?.error) {
      console.error("[payments] razorpay error payload:", err.error);
    }
    return res.status(500).json({
      message: err?.error?.description || err.message || "Could not create order",
    });
  }
});

/* ---------- Verify payment & confirm booking ---------- */
router.post("/verify", auth("taker"), async (req, res) => {
  try {
    // Ensure secret present before attempting HMAC
    if (!RAZORPAY_KEY_SECRET) {
      console.error("[payments] aborting verify: RAZORPAY_KEY_SECRET missing");
      return res.status(500).json({
        message: "Razorpay secret not configured on server.",
      });
    }

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

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    console.log("[payments] verify:", {
      order: razorpay_order_id,
      payment: razorpay_payment_id,
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
    return res.json({ success: true, booking: b });
  } catch (err) {
    console.error("[payments] verify error:", err?.message || err);
    return res.status(500).json({ message: err.message || "Verification failed" });
  }
});

export default router;