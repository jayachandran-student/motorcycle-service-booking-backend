import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  model: { type: String, trim: true },
  year: { type: Number },
  rentPerDay: { type: Number, default: 0 },
  description: { type: String, trim: true },
  images: { type: [String], default: [] }, 
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});


vehicleSchema.methods.isOwnedBy = function (userId) {
  return this.owner && this.owner.toString() === userId.toString();
};

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
