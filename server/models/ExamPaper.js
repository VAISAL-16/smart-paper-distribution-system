import mongoose from "mongoose";

const examPaperSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    examId: { type: String, index: true },
    course: { type: String, index: true },
    subject: { type: String },
    fileName: { type: String },
    hash: { type: String },
    status: { type: String, index: true },
    releaseTime: { type: String },
    uploadedAt: { type: String },
    allowedCoords: {
      lat: { type: Number },
      lng: { type: Number }
    },
    allowedRadiusKm: { type: Number },
    locationName: { type: String },
    uploadedBy: { type: String, index: true },
    uploadedByRole: { type: String }
  },
  { timestamps: true, strict: false }
);

const ExamPaper =
  mongoose.models.ExamPaper ||
  mongoose.model("ExamPaper", examPaperSchema, "exam_papers");

export default ExamPaper;
