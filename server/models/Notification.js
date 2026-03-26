import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    role: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    time: { type: String }
  },
  { timestamps: true, strict: false }
);

notificationSchema.index({ role: 1, read: 1, createdAt: -1 });
notificationSchema.index({ severity: 1, read: 1 }, { sparse: true });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema, "notifications");

export default Notification;
