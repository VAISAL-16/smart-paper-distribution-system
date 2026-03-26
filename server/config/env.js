import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).trim().toLowerCase() === "true";
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  mongoUrl: process.env.MONGO_URL || "",
  jwtSecret: process.env.JWT_SECRET || "secure_exam_jwt_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  commonOtp: String(process.env.COMMON_OTP || "123456").trim(),
  useStaticOtp: toBool(process.env.USE_STATIC_OTP, false),
  otpTtlMinutes: toNumber(process.env.OTP_TTL_MINUTES, 10),
  resetTokenTtlMinutes: toNumber(process.env.RESET_TOKEN_TTL_MINUTES, 10),
  loginRateLimitWindowMs: toNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  loginRateLimitMax: toNumber(process.env.LOGIN_RATE_LIMIT_MAX, 5),
  otpVerifyRateLimitWindowMs: toNumber(process.env.OTP_VERIFY_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  otpVerifyRateLimitMax: toNumber(process.env.OTP_VERIFY_RATE_LIMIT_MAX, 8),
  forgotRateLimitWindowMs: toNumber(process.env.FORGOT_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  forgotRateLimitMax: toNumber(process.env.FORGOT_RATE_LIMIT_MAX, 4),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "1mb",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  emailJsServiceId: process.env.EMAILJS_SERVICE_ID || "",
  emailJsTemplateId: process.env.EMAILJS_TEMPLATE_ID || "",
  emailJsLoginTemplateId: process.env.EMAILJS_LOGIN_TEMPLATE_ID || "",
  emailJsForgotTemplateId: process.env.EMAILJS_FORGOT_TEMPLATE_ID || "",
  emailJsPublicKey: process.env.EMAILJS_PUBLIC_KEY || "",
  emailJsPrivateKey: process.env.EMAILJS_PRIVATE_KEY || ""
};

export const isProduction = env.nodeEnv === "production";
