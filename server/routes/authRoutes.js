import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateRequest.js";
import {
  completeForgotPassword,
  loginUser,
  listUsers,
  registerUser,
  registerWithGoogle,
  requestForgotPasswordOtp,
  requestLoginOtp,
  updateUserStatus,
  verifyForgotPasswordOtp,
  verifyLoginOtp
} from "../controllers/authController.js";
import { ensureEnum, ensureObject, requireFields } from "../utils/validators.js";

const router = express.Router();

const validateRegister = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["name", "email", "password", "role"]);
  ensureEnum(String(req.body.role || "").trim().toUpperCase(), ["PAPER_SETTER", "INVIGILATOR"], "role");
};

const validateGoogleAuth = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["token"]);
  if (req.body.role) {
    ensureEnum(String(req.body.role || "").trim().toUpperCase(), ["PAPER_SETTER", "INVIGILATOR"], "role");
  }
};

const validateOtpRequest = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["email", "password"]);
};

const validateOtpVerify = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["email", "otp"]);
};

const validateForgotRequest = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["email"]);
};

const validateForgotComplete = (req) => {
  ensureObject(req.body, "body");
  requireFields(req.body, ["email", "resetToken", "action"]);
};

const validateUserStatusPatch = (req) => {
  ensureObject(req.body, "body");
  if (typeof req.body.active !== "boolean") {
    throw new Error("active must be a boolean");
  }
  ensureEnum(String(req.params.role || "").trim().toUpperCase(), ["ADMIN", "PAPER_SETTER", "INVIGILATOR"], "role");
};

router.post("/register", validate(validateRegister), registerUser);
router.post("/google", validate(validateGoogleAuth), registerWithGoogle);
router.post("/login", loginUser);
router.post("/login/request-otp", validate(validateOtpRequest), requestLoginOtp);
router.post("/login/verify-otp", validate(validateOtpVerify), verifyLoginOtp);
router.post("/forgot/request-otp", validate(validateForgotRequest), requestForgotPasswordOtp);
router.post("/forgot/verify-otp", validate(validateOtpVerify), verifyForgotPasswordOtp);
router.post("/forgot/complete", validate(validateForgotComplete), completeForgotPassword);
router.get("/users", requireAuth, requireRoles("ADMIN"), listUsers);
router.patch("/users/:role/:id", requireAuth, requireRoles("ADMIN"), validate(validateUserStatusPatch), updateUserStatus);

export default router;
