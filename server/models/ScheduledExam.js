import mongoose from "mongoose";

const scheduledExamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    code: { type: String, required: true, index: true },
    department: { type: String },
    subject: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: String },
    status: { type: String },
    centers: { type: Number, default: 0 }
  },
  { timestamps: true, strict: false }
);

const ScheduledExam =
  mongoose.models.ScheduledExam ||
  mongoose.model("ScheduledExam", scheduledExamSchema, "scheduled_exams");

export default ScheduledExam;
