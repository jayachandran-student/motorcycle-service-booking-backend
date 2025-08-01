const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// POST route - Save a new booking
router.post('/', async (req, res) => {
  try {
    const { customerName, serviceType, bikeModel, appointmentDate } = req.body;

    const newBooking = new Booking({
      customerName,
      serviceType,
      bikeModel,
      appointmentDate,
    });

    await newBooking.save();
    res.status(201).json({ message: 'Booking successful!' });
  } catch (error) {
    console.error('Error saving booking:', error.message);
    res.status(500).json({ error: 'Server error. Try again later.' });
  }
});


// ✅ GET route - Fetch all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ error: 'Server error while fetching bookings' });
  }
});

module.exports = router;
