# 🏍️ Motorcycle Service Booking – Backend

This is the **backend API** for the Motorcycle Service Booking platform.  
It provides authentication, role-based access (taker/lister), bookings, reviews, and Razorpay payment integration.

---

## 🚀 Features

- 🔑 User Authentication (JWT-based)
- 👥 Role-based access (Taker / Lister)
- 🏍️ Motorcycle CRUD (Lister only)
- 📅 Booking Management (Taker books, Lister manages)
- 💳 Razorpay Payments (test mode)
- ⭐ Reviews & Ratings
- 📊 Analytics endpoints for dashboard
- 🔒 Secure CORS setup for multiple environments

---

## 🛠️ Tech Stack

- Node.js + Express.js
- MongoDB (Atlas) + Mongoose
- JWT Authentication
- Razorpay SDK
- CORS + Morgan + Dotenv

---

## ⚙️ Setup

### 1️⃣ Clone the repo

```bash
git clone https://github.com/jayachandran-student/motorcycle-service-booking-backend.git
cd motorcycle-service-booking-backend
2️⃣ Install dependencies
bash
Copy code
npm install
3️⃣ Create .env file
env
Copy code
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

4️⃣ Run locally
npm run dev

Backend will start at: http://localhost:5000

🌐 Deployment

Render: https://motorcycle-service-booking-backend-5.onrender.com

(Health check → / should return API running 🚀)

📡 API Routes
Auth

POST /api/auth/register → Register user

POST /api/auth/login → Login

Motorcycles

GET /api/motorcycles → List all

POST /api/motorcycles → Add (lister only)

Bookings

POST /api/bookings → Create booking

GET /api/bookings/mine → My bookings (taker)

GET /api/bookings/for-my-vehicles → Lister’s bookings

DELETE /api/bookings/:id → Cancel booking

Payments

POST /api/payments/order → Create Razorpay order

POST /api/payments/verify → Verify payment

Reviews

POST /api/reviews → Add review (confirmed booking)

GET /api/reviews?motorcycleId=xyz → Get reviews for motorcycle

GET /api/reviews/summary?motorcycleId=xyz → Avg rating + count

🧪 Test Razorpay

Use Razorpay test card:

Card No: 4111 1111 1111 1111

Expiry: Any future date

CVV: 123

👨‍💻 Author

Developed by Jayachandran K
📧 Contact: jayachandran.k30@gmail.com
