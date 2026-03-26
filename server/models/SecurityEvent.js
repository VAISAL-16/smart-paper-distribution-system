import mongoose from "mongoose";
import { normalizeTextField } from "./helpers.js";

const securityEventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, set: normalizeTextField },
    severity: { type: String, default: "medium", index: true },
    status: { type: String, default: "OPEN", index: true },
    source: { type: String, default: "ADMIN", trim: true },
    ownerRole: { type: String, default: "ADMIN", trim: true, index: true },
    details: { type: String, default: "", trim: true },
    createdBy: { type: String, default: "system", trim: true, lowercase: true },
    createdAtLabel: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

securityEventSchema.index({ status: 1, severity: 1, createdAt: -1 });
securityEventSchema.index({ ownerRole: 1, status: 1 });

const SecurityEvent =
  mongoose.models.SecurityEvent ||
  mongoose.model("SecurityEvent", securityEventSchema, "security_events");

export default SecurityEvent;
