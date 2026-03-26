import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateRequest.js";
import ScheduledExam from "../models/ScheduledExam.js";
import ExamPaper from "../models/ExamPaper.js";
import PrintRequest from "../models/PrintRequest.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import SystemConfig from "../models/SystemConfig.js";
import SecurityEvent from "../models/SecurityEvent.js";
import PaperRevision from "../models/PaperRevision.js";
import QualityChecklist from "../models/QualityChecklist.js";
import IncidentReport from "../models/IncidentReport.js";
import { ensureArray } from "../utils/validators.js";

const router = express.Router();

router.use(requireAuth);

const modelByKey = {
  scheduledExams: ScheduledExam,
  examPapers: ExamPaper,
  printRequests: PrintRequest,
  notifications: Notification,
  auditLogs: AuditLog,
  systemConfig: SystemConfig,
  securityEvents: SecurityEvent,
  paperRevisions: PaperRevision,
  qualityChecklists: QualityChecklist,
  incidentReports: IncidentReport
};

const sanitizeDoc = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const { _id, __v, createdAt, updatedAt, ...safe } = doc;
  return safe;
};

const sanitizeList = (value) =>
  Array.isArray(value) ? value.map((item) => sanitizeDoc(item)) : [];

const permissionsByKey = {
  scheduledExams: {
    read: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"],
    write: ["ADMIN"]
  },
  examPapers: {
    read: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"],
    write: ["ADMIN", "PAPER_SETTER"]
  },
  printRequests: {
    read: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"],
    write: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"]
  },
  notifications: {
    read: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"],
    write: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"]
  },
  auditLogs: {
    read: ["ADMIN"],
    write: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"]
  },
  systemConfig: {
    read: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"],
    write: ["ADMIN"]
  },
  securityEvents: {
    read: ["ADMIN"],
    write: ["ADMIN"]
  },
  paperRevisions: {
    read: ["ADMIN", "PAPER_SETTER"],
    write: ["ADMIN", "PAPER_SETTER"]
  },
  qualityChecklists: {
    read: ["ADMIN", "PAPER_SETTER"],
    write: ["ADMIN", "PAPER_SETTER"]
  },
  incidentReports: {
    read: ["ADMIN", "INVIGILATOR"],
    write: ["ADMIN", "INVIGILATOR"]
  }
};

const ensureStorePermission = (req, res, accessType) => {
  const role = req.user?.role;
  const config = permissionsByKey[req.params.key];
  if (!config) {
    return res.status(400).json({ message: "Unsupported key" });
  }
  if (!config[accessType]?.includes(role)) {
    return res.status(403).json({ message: "Access denied for this resource" });
  }
  return null;
};

const validateStoreWrite = (req) => {
  ensureArray(req.body?.value, "value");
};

router.get("/:key", async (req, res) => {
  try {
    const denied = ensureStorePermission(req, res, "read");
    if (denied) return denied;
    const { key } = req.params;
    const Model = modelByKey[key];

    if (!Model) {
      return res.status(400).json({ message: "Unsupported key" });
    }

    const docs = await Model.find({}).lean();
    return res.json({ key, value: sanitizeList(docs) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load value", error: error.message });
  }
});

router.put("/:key", validate(validateStoreWrite), async (req, res) => {
  try {
    const denied = ensureStorePermission(req, res, "write");
    if (denied) return denied;
    const { key } = req.params;
    const { value } = req.body;
    const Model = modelByKey[key];

    if (!Model) {
      return res.status(400).json({ message: "Unsupported key" });
    }
    const safeValue = sanitizeList(value);
    await Model.deleteMany({});
    if (safeValue.length > 0) {
      await Model.insertMany(safeValue, { ordered: true });
    }

    return res.json({ key, value: safeValue });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save value", error: error.message });
  }
});

export default router;
