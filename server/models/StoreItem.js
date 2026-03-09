import mongoose from "mongoose";

const storeItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

const StoreItem =
  mongoose.models.StoreItem || mongoose.model("StoreItem", storeItemSchema);

export default StoreItem;
