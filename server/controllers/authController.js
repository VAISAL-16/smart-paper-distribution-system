import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import AdminUser from "../models/AdminUser.js";
import SetterUser from "../models/SetterUser.js";
import InvigilatorUser from "../models/InvigilatorUser.js";
import AuthOtp from "../models/AuthOtp.js";
import { sendEmail } from "../services/emailService.js";
import { sendSms, maskPhone, normalizePhone } from "../services/smsService.js";
import { createAuthToken } from "../utils/generateToken.js";
import { env } from "../config/env.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const OTP_SECRET = process.env.OTP_SECRET || "secure_exam_otp_secret";
const OTP_TTL_MINUTES = env.otpTtlMinutes;
const RESET_TOKEN_TTL_MINUTES = env.resetTokenTtlMinutes;
const STATIC_OTP = env.commonOtp;
const loginRequestWindowMs = env.loginRateLimitWindowMs;
const loginRequestMax = env.loginRateLimitMax;
const otpVerifyWindowMs = env.otpVerifyRateLimitWindowMs;
const otpVerifyMax = env.otpVerifyRateLimitMax;
const forgotRequestWindowMs = env.forgotRateLimitWindowMs;
const forgotRequestMax = env.forgotRateLimitMax;
const requestRateStore = new Map();

const defaultAdminEmail = (process.env.ADMIN_EMAIL || "vaisal16122005@gmail.com").trim().toLowerCase();
const defaultAdminPassword = String(process.env.ADMIN_PASSWORD || "1612");

const getRoleModel = (role) => {
  if (role === "ADMIN") return AdminUser;
  if (role === "PAPER_SETTER") return SetterUser;
  if (role === "INVIGILATOR") return InvigilatorUser;
  return null;
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  active: user.active !== false
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const verifyGoogleIdToken = async (token) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured on server");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const verifiedEmail = normalizeEmail(payload?.email || "");
  const verifiedName = String(payload?.name || "").trim();

  if (!verifiedEmail || !verifiedName) {
    throw new Error("Invalid Google token payload");
  }

  return { email: verifiedEmail, name: verifiedName };
};

const ensureDefaultAdmin = async () => {
  const existing = await AdminUser.findOne({ email: defaultAdminEmail });
  if (existing) return existing;
  const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
  return AdminUser.create({
    name: "Secure Admin",
    email: defaultAdminEmail,
    password: hashedPassword,
    role: "ADMIN",
    active: true,
    provider: "local"
  });
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  await ensureDefaultAdmin();

  const admin = await AdminUser.findOne({ email: normalizedEmail });
  if (admin) return admin;

  const setter = await SetterUser.findOne({ email: normalizedEmail });
  if (setter) return setter;

  const invigilator = await InvigilatorUser.findOne({ email: normalizedEmail });
  if (invigilator) return invigilator;

  return null;
};

const generateOtp = () => {
  if (env.useStaticOtp) {
    return STATIC_OTP;
  }
  return String(crypto.randomInt(100000, 1000000));
};

const hashValue = (value) =>
  crypto.createHash("sha256").update(`${value}:${OTP_SECRET}`).digest("hex");

const maskEmail = (email) => {
  const [name, domain] = String(email || "").split("@");
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
};

const getClientKey = (req, email) => {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const ip = forwardedFor || req.ip || "unknown-ip";
  return `${ip}:${normalizeEmail(email) || "anonymous"}`;
};

const checkRateLimit = (bucketKey, windowMs, max) => {
  const now = Date.now();
  const current = requestRateStore.get(bucketKey);

  if (!current || now > current.resetAt) {
    requestRateStore.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  requestRateStore.set(bucketKey, current);
  return { ok: true };
};

const createOtp = async ({ email, purpose, meta = {} }) => {
  const otp = generateOtp();
  await AuthOtp.create({
    email,
    purpose,
    otpHash: hashValue(`${email}:${purpose}:${otp}`),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    meta
  });
  return otp;
};

const readLatestOtp = async (email, purpose) =>
  AuthOtp.findOne({ email, purpose, usedAt: null })
    .sort({ createdAt: -1 });

const verifyOtpRecord = async (record, email, purpose, otp) => {
  if (!record) return { ok: false, message: "OTP not found. Request a new code." };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, message: "OTP expired. Request again." };
  if (record.attempts >= 5) return { ok: false, message: "Too many attempts. Request a new OTP." };

  const incomingHash = hashValue(`${email}:${purpose}:${String(otp || "").trim()}`);
  if (incomingHash !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    return { ok: false, message: "Invalid OTP." };
  }

  return { ok: true };
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedRole = String(role || "").trim().toUpperCase();
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = String(name || "").trim();
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedName || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    const Model = getRoleModel(normalizedRole);
    if (!Model || normalizedRole === "ADMIN") {
      return res.status(400).json({ message: "Role must be PAPER_SETTER or INVIGILATOR" });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await Model.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      role: normalizedRole,
      provider: "local"
    });

    return res.status(201).json({
      message: "User registered",
      user: sanitizeUser(created),
      token: createAuthToken(created)
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

export const registerWithGoogle = async (req, res) => {
  try {
    const { token, role } = req.body;
    const normalizedRole = String(role || "").trim().toUpperCase();
    const { email: normalizedEmail, name: normalizedName } = await verifyGoogleIdToken(token);

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.json({
        message: "Google sign-in success",
        user: sanitizeUser(existing),
        token: createAuthToken(existing)
      });
    }

    if (!normalizedRole) {
      return res.status(404).json({ message: "Account not found. Please sign up and select a role first." });
    }

    const Model = getRoleModel(normalizedRole);
    if (!Model || normalizedRole === "ADMIN") {
      return res.status(400).json({ message: "Role must be PAPER_SETTER or INVIGILATOR" });
    }

    const created = await Model.create({
      name: normalizedName,
      email: normalizedEmail,
      role: normalizedRole,
      provider: "google"
    });

    return res.status(201).json({
      message: "Google account registered",
      user: sanitizeUser(created),
      token: createAuthToken(created)
    });
  } catch (error) {
    return res.status(401).json({ message: "Google authentication failed", error: error.message });
  }
};

export const loginUser = async (_req, res) => {
  return res.status(410).json({ message: "Use OTP login endpoints: /login/request-otp and /login/verify-otp" });
};

export const requestLoginOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const rateLimit = checkRateLimit(
      `login-request:${getClientKey(req, normalizedEmail)}`,
      loginRequestWindowMs,
      loginRequestMax
    );

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    if (!rateLimit.ok) {
      return res.status(429).json({
        message: `Too many login OTP requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`
      });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.provider === "google") {
      return res.status(401).json({ message: "Use Google sign-in for this account" });
    }

    const validPassword = await bcrypt.compare(password, user.password || "");
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });
    if (user.active === false) {
      return res.status(403).json({ message: "Account disabled. Contact admin." });
    }

    const otp = await createOtp({
      email: normalizedEmail,
      purpose: "LOGIN_2FA",
      meta: { userId: String(user._id), role: user.role, name: user.name }
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "SecureExam Login Verification Code",
      text: `Your login OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `<p>Your login OTP is <b>${otp}</b>.</p><p>Expires in ${OTP_TTL_MINUTES} minutes.</p>`,
      templateId: env.emailJsLoginTemplateId || env.emailJsTemplateId
    });

    return res.json({
      message: "OTP sent to registered email.",
      destination: maskEmail(normalizedEmail),
      expiresInMinutes: OTP_TTL_MINUTES
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send login OTP", error: error.message });
  }
};

export const listUsers = async (_req, res) => {
  try {
    await ensureDefaultAdmin();
    const [admins, setters, invigilators] = await Promise.all([
      AdminUser.find({}).lean(),
      SetterUser.find({}).lean(),
      InvigilatorUser.find({}).lean()
    ]);

    const users = [...admins, ...setters, ...invigilators]
      .map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        provider: user.provider || "local",
        active: user.active !== false,
        createdAt: user.createdAt || null
      }))
      .sort((a, b) => String(a.role).localeCompare(String(b.role)) || String(a.email).localeCompare(String(b.email)));

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load users", error: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { role, id } = req.params;
    const { active } = req.body;
    const Model = getRoleModel(String(role || "").toUpperCase());

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.active = Boolean(active);
    await user.save();

    return res.json({ message: "User status updated", user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const rateLimit = checkRateLimit(
      `login-verify:${getClientKey(req, normalizedEmail)}`,
      otpVerifyWindowMs,
      otpVerifyMax
    );
    if (!normalizedEmail || !otp) {
      return res.status(400).json({ message: "email and otp are required" });
    }
    if (!rateLimit.ok) {
      return res.status(429).json({
        message: `Too many OTP attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`
      });
    }

    const otpRecord = await readLatestOtp(normalizedEmail, "LOGIN_2FA");
    const verdict = await verifyOtpRecord(otpRecord, normalizedEmail, "LOGIN_2FA", otp);
    if (!verdict.ok) return res.status(400).json({ message: verdict.message });

    otpRecord.usedAt = new Date();
    await otpRecord.save();

    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(404).json({ message: "User no longer exists" });

    return res.json({
      message: "Login verified",
      user: sanitizeUser(user),
      token: createAuthToken(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

export const requestForgotPasswordOtp = async (req, res) => {
  try {
    const { email, deliveryChoice } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedDeliveryChoice = String(deliveryChoice || "EMAIL").trim().toUpperCase();
    const rateLimit = checkRateLimit(
      `forgot-request:${getClientKey(req, normalizedEmail)}`,
      forgotRequestWindowMs,
      forgotRequestMax
    );
    if (!normalizedEmail) return res.status(400).json({ message: "email is required" });
    if (!rateLimit.ok) {
      return res.status(429).json({
        message: `Too many recovery requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`
      });
    }
    if (!["EMAIL", "SMS"].includes(normalizedDeliveryChoice)) {
      return res.status(400).json({ message: "deliveryChoice must be EMAIL or SMS" });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(404).json({ message: "Account not found" });

    if (user.provider === "google") {
      return res.status(400).json({ message: "Google account. Use Google sign-in." });
    }

    const otp = await createOtp({
      email: normalizedEmail,
      purpose: "FORGOT_PASSWORD",
      meta: { userId: String(user._id), role: user.role, deliveryChoice: normalizedDeliveryChoice }
    });

    let destination = maskEmail(normalizedEmail);
    if (normalizedDeliveryChoice === "SMS") {
      const phone = normalizePhone(user.phone);
      if (!phone) {
        return res.status(400).json({
          message: "No phone number found on your account. Use email recovery or update your profile phone."
        });
      }
      const smsResult = await sendSms({
        to: phone,
        text: `SecureExam recovery OTP: ${otp}. Expires in ${OTP_TTL_MINUTES} minutes.`
      });
      destination = smsResult.destination || maskPhone(phone);
    } else {
      await sendEmail({
        to: normalizedEmail,
        subject: "SecureExam Password Recovery OTP",
        text: `Your password recovery OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
        html: `<p>Your password recovery OTP is <b>${otp}</b>.</p><p>Expires in ${OTP_TTL_MINUTES} minutes.</p>`,
        templateId: env.emailJsForgotTemplateId || env.emailJsTemplateId
      });
    }

    return res.json({
      message: "Password recovery OTP sent.",
      destination,
      channel: normalizedDeliveryChoice,
      expiresInMinutes: OTP_TTL_MINUTES
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send forgot-password OTP", error: error.message });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const rateLimit = checkRateLimit(
      `forgot-verify:${getClientKey(req, normalizedEmail)}`,
      otpVerifyWindowMs,
      otpVerifyMax
    );
    if (!normalizedEmail || !otp) {
      return res.status(400).json({ message: "email and otp are required" });
    }
    if (!rateLimit.ok) {
      return res.status(429).json({
        message: `Too many OTP attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`
      });
    }

    const otpRecord = await readLatestOtp(normalizedEmail, "FORGOT_PASSWORD");
    const verdict = await verifyOtpRecord(otpRecord, normalizedEmail, "FORGOT_PASSWORD", otp);
    if (!verdict.ok) return res.status(400).json({ message: verdict.message });

    const resetToken = crypto.randomBytes(24).toString("hex");
    otpRecord.verifiedAt = new Date();
    otpRecord.resetTokenHash = hashValue(resetToken);
    otpRecord.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    await otpRecord.save();

    return res.json({
      message: "OTP verified.",
      resetToken,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES
    });
  } catch (error) {
    return res.status(500).json({ message: "Forgot-password OTP verification failed", error: error.message });
  }
};

export const completeForgotPassword = async (req, res) => {
  try {
    const { email, resetToken, action, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedAction = String(action || "").trim().toUpperCase();
    if (!normalizedEmail || !resetToken || !normalizedAction) {
      return res.status(400).json({ message: "email, resetToken and action are required" });
    }

    const record = await AuthOtp.findOne({
      email: normalizedEmail,
      purpose: "FORGOT_PASSWORD",
      completedAt: null
    }).sort({ createdAt: -1 });

    if (!record || !record.resetTokenHash || !record.resetTokenExpiresAt) {
      return res.status(400).json({ message: "Invalid or expired reset session" });
    }
    if (record.resetTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Reset session expired. Verify OTP again." });
    }
    if (record.resetTokenHash !== hashValue(resetToken)) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    if (!["KEEP", "RESET"].includes(normalizedAction)) {
      return res.status(400).json({ message: "action must be KEEP or RESET" });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(404).json({ message: "Account not found" });

    if (normalizedAction === "RESET") {
      if (!newPassword || String(newPassword).length < 4) {
        return res.status(400).json({ message: "New password must be at least 4 characters" });
      }
      user.password = await bcrypt.hash(String(newPassword), 10);
      user.provider = "local";
      await user.save();
    }

    record.usedAt = new Date();
    record.completedAt = new Date();
    await record.save();

    return res.json({
      message: normalizedAction === "RESET" ? "Password changed successfully." : "Verification completed. Existing password kept."
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to complete forgot-password flow", error: error.message });
  }
};
