import mongoose from "mongoose";

const printRequestSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    course: { type: String, required: true, index: true },
    examDate: { type: String, required: true },
    students: { type: String },
    requestedCopies: { type: String },
    status: { type: String, index: true },
    requestedBy: { type: String, index: true },
    maxAllowedCopies: { type: String },
    approvedCopies: { type: String }
  },
  { timestamps: true, strict: false }
);

const PrintRequest =
  mongoose.models.PrintRequest ||
  mongoose.model("PrintRequest", printRequestSchema, "print_requests");

export default PrintRequest;
