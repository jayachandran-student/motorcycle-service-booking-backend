const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  vehicle: {
    make: String, model: String, year: String, plate: String, vehicleId: String
  },
  serviceType: { type: String, required:true }, 
  date: { type: Date, required:true },
  status: { type: String, enum:['pending','confirmed','in_progress','completed','cancelled'], default:'pending' },
  amount: { type: Number, default:0 },
  paid: { type: Boolean, default:false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
