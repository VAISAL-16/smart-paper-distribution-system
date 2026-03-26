import mongoose from "mongoose";
import { normalizeTextField } from "./helpers.js";

const examPaperSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    examId: { type: String, index: true },
    course: { type: String, index: true, set: normalizeTextField, trim: true },
    subject: { type: String, default: "", trim: true },
    fileName: { type: String, default: "", trim: true },
    hash: { type: String },
    status: { type: String, index: true },
    releaseTime: { type: String },
    uploadedAt: { type: String },
    allowedCoords: {
      lat: { type: Number },
      lng: { type: Number }
    },
    allowedRadiusKm: { type: Number },
    locationName: { type: String, default: "", trim: true, index: true },
    uploadedBy: { type: String, index: true, trim: true, lowercase: true },
    uploadedByRole: { type: String }
  },
  { timestamps: true, strict: false }
);

examPaperSchema.index({ examId: 1, status: 1 });
examPaperSchema.index({ uploadedBy: 1, status: 1, uploadedAt: -1 });
examPaperSchema.index({ locationName: 1, status: 1 });

const ExamPaper =
  mongoose.models.ExamPaper ||
  mongoose.model("ExamPaper", examPaperSchema, "exam_papers");

export default ExamPaper;
