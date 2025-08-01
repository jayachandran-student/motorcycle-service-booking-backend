const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bookingRoutes = require('./routes/booking');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bookings', bookingRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://Jayachandran:yourSecurePassword123@motorcycle-cluster.tni3usa.mongodb.net/?retryWrites=true&w=majority&appName=motorcycle-cluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection failed:', error.message);
});
