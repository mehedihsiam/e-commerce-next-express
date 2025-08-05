import mongoose from 'mongoose';
import { ROLES } from '../../constants/ROLES.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    deleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('User', userSchema);

export default User;
