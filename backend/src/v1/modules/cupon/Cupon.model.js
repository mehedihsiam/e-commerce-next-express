import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discountType: { type: String, enum: ["flat", "percent"], required: true },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  expiresAt: Date,
  usageCount: { type: Number, default: 0 },
  usageLimit: Number,
  isActive: { type: Boolean, default: true },
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
