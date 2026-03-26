import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user: { type: String, required: true, index: true },
    action: { type: String, required: true },
    subject: { type: String },
    time: { type: String },
    hash: { type: String }
  },
  { timestamps: true, strict: false }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema, "audit_logs");

export default AuditLog;
