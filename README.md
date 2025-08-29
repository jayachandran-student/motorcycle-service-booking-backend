# Motorcycle Service Booking - Backend

This is the **backend API** for the Motorcycle Service Booking platform.  
It handles authentication, motorcycle listings, bookings, payments (Razorpay), and reviews.

---

## 🚀 Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Razorpay Payment Gateway
- CORS + Secure Configs
- Render Hosting

---

## ⚙️ Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000
MONGO_URI=mongodb+srv://Jayachandran:yourSecurePassword123@motorcycle-cluster.tni3usa.mongodb.net/motorcycle_service?retryWrites=true&w=majority&appName=motorcycle-cluster
JWT_SECRET=mySuperStrongJWTsecretKey_2025@!
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:3000
CLIENT_URL_VITE=http://localhost:5173
CLIENT_URL_PROD=https://motorcyclebook.netlify.app
RAZORPAY_KEY_ID=rzp_test_RB9ml3FDulSn8s
RAZORPAY_KEY_SECRET=wMregYfDD2tDBkd2VIDD8x0P
```

## 🧠 Author

Jayachandran K
