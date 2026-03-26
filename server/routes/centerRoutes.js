import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateRequest.js";
import {
  getAllCenters,
  getCenterByName,
  trackCenterEvent,
  upsertCenterMaster
} from "../controllers/centerController.js";
import { ensureObject, requireFields } from "../utils/validators.js";

const router = express.Router();

const validateTrackCenter = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["centerName"]);
};

const validateCenterMaster = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["centerName"]);
};

router.use(requireAuth);
router.post("/track", requireRoles("ADMIN", "PAPER_SETTER", "INVIGILATOR"), validate(validateTrackCenter), trackCenterEvent);
router.post("/master", requireRoles("ADMIN"), validate(validateCenterMaster), upsertCenterMaster);
router.get("/", requireRoles("ADMIN", "PAPER_SETTER", "INVIGILATOR"), getAllCenters);
router.get("/:centerName", requireRoles("ADMIN", "PAPER_SETTER", "INVIGILATOR"), getCenterByName);

export default router;
