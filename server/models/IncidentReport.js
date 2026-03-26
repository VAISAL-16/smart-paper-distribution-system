import mongoose from "mongoose";

const incidentReportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: "OPERATIONS", index: true },
    severity: { type: String, default: "medium", index: true },
    status: { type: String, default: "OPEN", index: true },
    centerName: { type: String, default: "", index: true },
    examCode: { type: String, default: "", index: true },
    description: { type: String, required: true },
    reportedBy: { type: String, default: "unknown@local", index: true },
    role: { type: String, default: "INVIGILATOR", index: true },
    createdAtLabel: { type: String, default: "" }
  },
  { timestamps: true, strict: false }
);

incidentReportSchema.index({ reportedBy: 1, status: 1, createdAt: -1 });
incidentReportSchema.index({ centerName: 1, status: 1, severity: 1 });

const IncidentReport =
  mongoose.models.IncidentReport ||
  mongoose.model("IncidentReport", incidentReportSchema, "incident_reports");

export default IncidentReport;
