import mongoose from "mongoose";
const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  make: String, model: String, regNumber: String,
  pricePerDay: { type:Number, required:true, min:0 },
  available: { type:Boolean, default:true },
  images: [String]
},{timestamps:true});
export default mongoose.model("Motorcycle", schema);
