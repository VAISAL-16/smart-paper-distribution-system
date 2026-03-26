import connectDB from "../config/db.js";
import AdminUser from "../models/AdminUser.js";
import AuditLog from "../models/AuditLog.js";
import AuthOtp from "../models/AuthOtp.js";
import Center from "../models/Center.js";
import ExamPaper from "../models/ExamPaper.js";
import IncidentReport from "../models/IncidentReport.js";
import InvigilatorUser from "../models/InvigilatorUser.js";
import Notification from "../models/Notification.js";
import PaperRevision from "../models/PaperRevision.js";
import PrintRequest from "../models/PrintRequest.js";
import QualityChecklist from "../models/QualityChecklist.js";
import ScheduledExam from "../models/ScheduledExam.js";
import SecurityEvent from "../models/SecurityEvent.js";
import SetterUser from "../models/SetterUser.js";
import SystemConfig from "../models/SystemConfig.js";

const models = [
  AdminUser,
  SetterUser,
  InvigilatorUser,
  AuthOtp,
  AuditLog,
  Center,
  ExamPaper,
  IncidentReport,
  Notification,
  PaperRevision,
  PrintRequest,
  QualityChecklist,
  ScheduledExam,
  SecurityEvent,
  SystemConfig
];

const run = async () => {
  await connectDB();

  for (const Model of models) {
    await Model.syncIndexes();
    console.log(`Synced indexes for ${Model.modelName}`);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to sync indexes", error);
  process.exit(1);
});
