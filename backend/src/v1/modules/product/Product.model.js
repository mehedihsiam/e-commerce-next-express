import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  images: [String],
  price: { type: Number, required: true },
  discountPrice: Number,
  stock: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  tags: [String],
  variants: [
    {
      color: String,
      size: String,
      stock: Number,
      price: Number,
    },
  ],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);
export default Product;
