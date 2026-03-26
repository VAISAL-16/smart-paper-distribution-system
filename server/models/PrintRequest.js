import mongoose from "mongoose";
import { normalizeTextField } from "./helpers.js";

const printRequestSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    centerName: { type: String, default: "", trim: true, index: true },
    institutionName: { type: String, default: "", trim: true },
    course: { type: String, required: true, index: true, set: normalizeTextField, trim: true },
    examDate: { type: String, required: true, index: true },
    students: { type: String, default: "" },
    requestedCopies: { type: String, default: "" },
    status: { type: String, index: true, default: "PENDING_SETTER_APPROVAL" },
    requestedBy: { type: String, index: true, trim: true, lowercase: true },
    maxAllowedCopies: { type: String, default: "" },
    approvedCopies: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

printRequestSchema.index({ requestedBy: 1, status: 1, examDate: 1 });
printRequestSchema.index({ centerName: 1, examDate: 1, status: 1 });

const PrintRequest =
  mongoose.models.PrintRequest ||
  mongoose.model("PrintRequest", printRequestSchema, "print_requests");

export default PrintRequest;
