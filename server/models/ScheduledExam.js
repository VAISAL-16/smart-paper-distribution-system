import mongoose from "mongoose";
import { normalizeTextField } from "./helpers.js";

const scheduledExamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    code: { type: String, required: true, index: true, set: normalizeTextField, trim: true },
    department: { type: String, default: "", trim: true },
    subject: { type: String, required: true, set: normalizeTextField, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: String, default: "" },
    status: { type: String, default: "", index: true },
    centers: { type: Number, default: 0 }
  },
  { timestamps: true, strict: false }
);

scheduledExamSchema.index({ date: 1, time: 1 });
scheduledExamSchema.index({ code: 1, date: 1 });

const ScheduledExam =
  mongoose.models.ScheduledExam ||
  mongoose.model("ScheduledExam", scheduledExamSchema, "scheduled_exams");

export default ScheduledExam;
