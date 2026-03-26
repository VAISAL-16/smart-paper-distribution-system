import mongoose from "mongoose";
import { normalizeEmailField, normalizeTextField } from "./helpers.js";

const setterUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, set: normalizeTextField, trim: true },
    email: { type: String, required: true, unique: true, index: true, set: normalizeEmailField, lowercase: true, trim: true },
    password: { type: String },
    phone: { type: String, default: "", index: true, sparse: true, trim: true },
    active: { type: Boolean, default: true, index: true },
    role: {
      type: String,
      enum: ["PAPER_SETTER"],
      default: "PAPER_SETTER"
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    }
  },
  { timestamps: true }
);

setterUserSchema.index({ role: 1, active: 1 });
setterUserSchema.index({ provider: 1, active: 1 });

const SetterUser =
  mongoose.models.SetterUser ||
  mongoose.model("SetterUser", setterUserSchema, "setters");

export default SetterUser;
