import mongoose from "mongoose";
import { normalizeEmailField, normalizeTextField } from "./helpers.js";

const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, set: normalizeTextField, trim: true },
    email: { type: String, required: true, unique: true, index: true, set: normalizeEmailField, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: "", index: true, sparse: true, trim: true },
    active: { type: Boolean, default: true, index: true },
    role: {
      type: String,
      enum: ["ADMIN"],
      default: "ADMIN"
    },
    provider: {
      type: String,
      enum: ["local"],
      default: "local"
    }
  },
  { timestamps: true }
);

adminUserSchema.index({ role: 1, active: 1 });

const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model("AdminUser", adminUserSchema, "admins");

export default AdminUser;
