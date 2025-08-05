import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  storeName: String,
  logo: String,
  contactEmail: String,
  contactPhone: String,
  address: String,
  currency: { type: String, default: "USD" },
});

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
