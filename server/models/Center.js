import mongoose from "mongoose";
import { normalizeTextField } from "./helpers.js";

const centerRequestSchema = new mongoose.Schema(
  {
    requestId: { type: Number, index: true },
    institutionName: String,
    course: String,
    examDate: String,
    status: String,
    requestedCopies: Number,
    maxAllowedCopies: Number,
    approvedCopies: Number,
    requestedBy: String,
    updatedAt: String
  },
  { _id: false }
);

const centerPaperSchema = new mongoose.Schema(
  {
    paperId: { type: String, index: true },
    examId: String,
    course: String,
    subject: String,
    status: String,
    uploadedBy: String,
    uploadedAt: String,
    releaseTime: String,
    updatedAt: String
  },
  { _id: false }
);

const centerPrintLogSchema = new mongoose.Schema(
  {
    paperId: String,
    printedBy: String,
    copies: Number,
    printedAt: String
  },
  { _id: false }
);

const centerSchema = new mongoose.Schema(
  {
    centerName: { type: String, required: true, unique: true, index: true, set: normalizeTextField, trim: true },
    institutionName: { type: String, default: "", trim: true },
    venue: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true, index: true },
    district: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true, index: true },
    contactPerson: { type: String, default: "", trim: true },
    contactPhone: { type: String, default: "", trim: true },
    requests: [centerRequestSchema],
    papers: [centerPaperSchema],
    printLogs: [centerPrintLogSchema],
    stats: {
      totalRequests: { type: Number, default: 0 },
      approvedRequests: { type: Number, default: 0 },
      rejectedRequests: { type: Number, default: 0 },
      pendingRequests: { type: Number, default: 0 },
      forwardedRequests: { type: Number, default: 0 },
      totalPapers: { type: Number, default: 0 },
      releasedPapers: { type: Number, default: 0 },
      totalPrintedCopies: { type: Number, default: 0 },
      totalPrintEvents: { type: Number, default: 0 },
      lastPrintedAt: { type: String, default: null }
    }
  },
  { timestamps: true }
);

centerSchema.index({ state: 1, city: 1 });
centerSchema.index({ "stats.totalRequests": -1 });

const Center = mongoose.models.Center || mongoose.model("Center", centerSchema, "centers");

export default Center;
