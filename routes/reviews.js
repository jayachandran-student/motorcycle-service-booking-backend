const express = require('express');
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'completed') {
      return res.status(400).json({ msg: 'Invalid booking for review' });
    }
    const review = new Review({
      booking: bookingId,
      reviewer: req.user.id,
      provider: booking.provider,
      rating,
      comment
    });
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
