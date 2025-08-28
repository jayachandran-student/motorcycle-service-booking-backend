import mongoose from "mongoose";
const schema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref:"Booking", required:true },
  motorcycle: { type: mongoose.Schema.Types.ObjectId, ref:"Motorcycle", required:true },
  user: { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  rating: { type:Number, min:1, max:5, required:true },
  comment: { type:String, maxlength:800 }
},{timestamps:true});
export default mongoose.model("Review", schema);
