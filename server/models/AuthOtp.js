import mongoose from "mongoose";
import { normalizeEmailField } from "./helpers.js";

const authOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, set: normalizeEmailField, lowercase: true, trim: true },
    purpose: {
      type: String,
      enum: ["LOGIN_2FA", "FORGOT_PASSWORD"],
      required: true,
      index: true
    },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

authOtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
authOtpSchema.index({ email: 1, purpose: 1, usedAt: 1 });

const AuthOtp =
  mongoose.models.AuthOtp ||
  mongoose.model("AuthOtp", authOtpSchema, "auth_otps");

export default AuthOtp;
