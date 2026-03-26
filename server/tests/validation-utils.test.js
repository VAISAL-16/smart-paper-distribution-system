import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../utils/AppError.js";
import {
  ensureArray,
  ensureEnum,
  ensureObject,
  normalizeEmailValue,
  normalizeText,
  requireFields
} from "../utils/validators.js";

test("normalize helpers trim and lowercase correctly", () => {
  assert.equal(normalizeText("  Hello  "), "Hello");
  assert.equal(normalizeEmailValue("  USER@Example.COM "), "user@example.com");
});

test("requireFields throws AppError for missing fields", () => {
  assert.throws(
    () => requireFields({ email: "user@example.com" }, ["email", "password"]),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test("ensureEnum rejects unsupported values", () => {
  assert.throws(
    () => ensureEnum("GUEST", ["ADMIN", "INVIGILATOR"], "role"),
    (error) => error instanceof AppError && /must be one of/.test(error.message)
  );
});

test("ensureArray and ensureObject validate shapes", () => {
  assert.doesNotThrow(() => ensureArray([]));
  assert.doesNotThrow(() => ensureObject({ ok: true }));
  assert.throws(() => ensureArray({}), AppError);
  assert.throws(() => ensureObject([]), AppError);
});
