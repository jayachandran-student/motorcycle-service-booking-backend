const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  bikeModel: {
    type: String,
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
