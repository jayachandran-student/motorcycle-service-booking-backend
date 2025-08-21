const express = require('express');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const router = express.Router();

router.get('/bookings-per-day', auth, async (req, res) => {
  const data = await Booking.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(data);
});

module.exports = router;
