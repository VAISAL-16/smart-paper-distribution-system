import mongoose from "mongoose";

const paperRevisionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    paperId: { type: String, required: true, index: true },
    examId: { type: String, index: true },
    course: { type: String, index: true },
    subject: { type: String, default: "" },
    note: { type: String, required: true },
    revisionType: { type: String, default: "CONTENT_UPDATE" },
    createdBy: { type: String, default: "unknown@local", index: true },
    createdAtLabel: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

paperRevisionSchema.index({ paperId: 1, createdAt: -1 });
paperRevisionSchema.index({ createdBy: 1, createdAt: -1 });

const PaperRevision =
  mongoose.models.PaperRevision ||
  mongoose.model("PaperRevision", paperRevisionSchema, "paper_revisions");

export default PaperRevision;
