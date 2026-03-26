import mongoose from "mongoose";

const qualityChecklistSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    examId: { type: String, required: true, index: true },
    course: { type: String, required: true, index: true },
    subject: { type: String, default: "" },
    setterEmail: { type: String, required: true, index: true },
    formatVerified: { type: Boolean, default: false },
    durationVerified: { type: Boolean, default: false },
    instructionsVerified: { type: Boolean, default: false },
    encryptionReady: { type: Boolean, default: false },
    centerPinned: { type: Boolean, default: false },
    remarks: { type: String, default: "" },
    savedAtLabel: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

qualityChecklistSchema.index({ setterEmail: 1, updatedAt: -1 });
qualityChecklistSchema.index({ course: 1, setterEmail: 1 });

const QualityChecklist =
  mongoose.models.QualityChecklist ||
  mongoose.model("QualityChecklist", qualityChecklistSchema, "quality_checklists");

export default QualityChecklist;
