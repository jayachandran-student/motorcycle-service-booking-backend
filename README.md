# Motorcycle Service Booking — Backend (MERN)

**Live API:** https://bike-service-backend-idw4.onrender.com  
**Frontend:** https://whimsical-froyo-e74491.netlify.app  
**Repo:** https://github.com/jayachandran-student/motorcycle-service-booking-backend

Node.js + Express + MongoDB + JWT auth + Razorpay (Test).

---

## Features

- Auth (register/login, JWT, role: `taker` or `lister`)
- Motorcycles (Lister CRUD)
- Bookings (Taker create/cancel, Lister view for own vehicles)
- Payments (Razorpay Test: create order & verify)
- Reviews (Taker after confirmed booking)
- CORS-safe for local + Netlify

---

## Quick Start (Local)

```bash
git clone https://github.com/jayachandran-student/motorcycle-service-booking-backend.git
cd motorcycle-service-booking-backend
cp .env.example .env     # fill values
npm i
npm run dev              # or: npm start
```
