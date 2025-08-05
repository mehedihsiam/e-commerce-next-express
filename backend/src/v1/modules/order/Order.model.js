import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  guestEmail: { type: String, default: null },
  guestPhone: { type: String, default: null },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      variant: {
        color: String,
        size: String,
      },
    },
  ],
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  paymentMethod: { type: String, enum: ["COD", "Online"], required: true },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  orderStatus: {
    type: String,
    enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Processing",
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    default: null,
  },
  totalAmount: Number,
  discountAmount: Number,
  taxAmount: Number,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
