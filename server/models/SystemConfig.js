import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    unlockLeadMinutes: { type: Number, default: 5 },
    escalationWindowMinutes: { type: Number, default: 30 },
    geoFenceMeters: { type: Number, default: 100 },
    allowManualRelease: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    centerAutoRefreshSeconds: { type: Number, default: 10 },
    notes: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

systemConfigSchema.index({ maintenanceMode: 1 });

const SystemConfig =
  mongoose.models.SystemConfig ||
  mongoose.model("SystemConfig", systemConfigSchema, "system_config");

export default SystemConfig;
