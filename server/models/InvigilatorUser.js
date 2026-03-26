import mongoose from "mongoose";
import { normalizeEmailField, normalizeTextField } from "./helpers.js";

const invigilatorUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, set: normalizeTextField, trim: true },
    email: { type: String, required: true, unique: true, index: true, set: normalizeEmailField, lowercase: true, trim: true },
    password: { type: String },
    phone: { type: String, default: "", index: true, sparse: true, trim: true },
    active: { type: Boolean, default: true, index: true },
    role: {
      type: String,
      enum: ["INVIGILATOR"],
      default: "INVIGILATOR"
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    }
  },
  { timestamps: true }
);

invigilatorUserSchema.index({ role: 1, active: 1 });
invigilatorUserSchema.index({ provider: 1, active: 1 });

const InvigilatorUser =
  mongoose.models.InvigilatorUser ||
  mongoose.model("InvigilatorUser", invigilatorUserSchema, "invigilators");

export default InvigilatorUser;
