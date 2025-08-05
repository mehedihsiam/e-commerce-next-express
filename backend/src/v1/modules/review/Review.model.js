import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
