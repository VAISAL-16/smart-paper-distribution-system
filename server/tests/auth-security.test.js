import test from "node:test";
import assert from "node:assert/strict";
import { createAuthToken, verifyAuthToken } from "../utils/generateToken.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";

const createRes = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return response;
};

test("createAuthToken and verifyAuthToken round-trip payload", () => {
  const token = createAuthToken({
    _id: "507f1f77bcf86cd799439011",
    email: "admin@example.com",
    role: "ADMIN"
  });

  const decoded = verifyAuthToken(token);
  assert.equal(decoded.email, "admin@example.com");
  assert.equal(decoded.role, "ADMIN");
  assert.equal(decoded.sub, "507f1f77bcf86cd799439011");
});

test("requireAuth rejects requests without bearer token", () => {
  const req = { headers: {} };
  const res = createRes();
  let nextCalled = false;

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentication required");
});

test("requireAuth accepts valid bearer token and attaches user", () => {
  const token = createAuthToken({
    _id: "507f1f77bcf86cd799439011",
    email: "setter@example.com",
    role: "PAPER_SETTER"
  });

  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createRes();
  let nextCalled = false;

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.email, "setter@example.com");
  assert.equal(req.user.role, "PAPER_SETTER");
});

test("requireRoles blocks unauthorized role", () => {
  const req = { user: { role: "INVIGILATOR" } };
  const res = createRes();
  let nextCalled = false;

  requireRoles("ADMIN")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Access denied for this role");
});

test("requireRoles allows authorized role", () => {
  const req = { user: { role: "ADMIN" } };
  const res = createRes();
  let nextCalled = false;

  requireRoles("ADMIN", "PAPER_SETTER")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
