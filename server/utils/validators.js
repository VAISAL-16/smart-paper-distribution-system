import AppError from "./AppError.js";

export const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const normalizeText = (value) => String(value || "").trim();

export const normalizeEmailValue = (value) => normalizeText(value).toLowerCase();

export const requireFields = (payload, fields) => {
  const missing = fields.filter((field) => !isNonEmptyString(payload?.[field]));
  if (missing.length > 0) {
    throw new AppError(400, `Missing required field(s): ${missing.join(", ")}`);
  }
};

export const ensureEnum = (value, allowed, label) => {
  if (!allowed.includes(value)) {
    throw new AppError(400, `${label} must be one of: ${allowed.join(", ")}`);
  }
};

export const ensureArray = (value, label = "value") => {
  if (!Array.isArray(value)) {
    throw new AppError(400, `${label} must be an array`);
  }
};

export const ensureObject = (value, label = "value") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(400, `${label} must be an object`);
  }
};
