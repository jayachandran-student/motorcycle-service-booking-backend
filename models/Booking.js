import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  motorcycle: { type: mongoose.Schema.Types.ObjectId, ref:"Motorcycle", required:true },
  startDate: Date, endDate: Date,
  totalPrice: Number,
  status: { type:String, enum:["pending","confirmed","cancelled"], default:"pending" },
  paymentId: String, orderId: String
},{timestamps:true});
export default mongoose.model("Booking", schema);
