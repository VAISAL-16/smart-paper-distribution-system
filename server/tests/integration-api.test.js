import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { createApp } from "../app.js";
import { createAuthToken } from "../utils/generateToken.js";
import AdminUser from "../models/AdminUser.js";
import SetterUser from "../models/SetterUser.js";
import InvigilatorUser from "../models/InvigilatorUser.js";
import AuthOtp from "../models/AuthOtp.js";
import SystemConfig from "../models/SystemConfig.js";
import Center from "../models/Center.js";

const withServer = async (run) => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

const patchMethod = (target, method, replacement) => {
  const original = target[method];
  target[method] = replacement;
  return () => {
    target[method] = original;
  };
};

test("GET /health returns standard health payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "ok");
    assert.ok(payload.requestId);
  });
});

test("POST /api/auth/login/request-otp validates required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/login/request-otp works with valid mocked user", async () => {
  const passwordHash = await bcrypt.hash("1612", 10);
  const restoreAdminFind = patchMethod(AdminUser, "findOne", async ({ email }) => {
    if (email !== "admin@example.com" && email !== "vaisal16122005@gmail.com") return null;
    return {
      _id: "507f1f77bcf86cd799439011",
      name: "Admin",
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
      provider: "local",
      active: true
    };
  });
  const restoreAdminCreate = patchMethod(AdminUser, "create", async () => ({
    _id: "507f1f77bcf86cd799439011",
    name: "Admin",
    email: "admin@example.com",
    password: passwordHash,
    role: "ADMIN",
    provider: "local",
    active: true
  }));
  const restoreSetterFind = patchMethod(SetterUser, "findOne", async () => null);
  const restoreInvigilatorFind = patchMethod(InvigilatorUser, "findOne", async () => null);
  const restoreOtpCreate = patchMethod(AuthOtp, "create", async () => ({ ok: true }));

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@example.com", password: "1612" })
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.message, "OTP sent to registered email.");
    });
  } finally {
    restoreAdminFind();
    restoreAdminCreate();
    restoreSetterFind();
    restoreInvigilatorFind();
    restoreOtpCreate();
  }
});

test("GET /api/auth/users blocks non-admin token", async () => {
  const token = createAuthToken({
    _id: "507f191e810c19729de860ea",
    email: "inv@example.com",
    role: "INVIGILATOR"
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Access denied for this role");
  });
});

test("GET /api/auth/users returns users for admin", async () => {
  const token = createAuthToken({
    _id: "507f1f77bcf86cd799439011",
    email: "admin@example.com",
    role: "ADMIN"
  });
  const restoreAdminFind = patchMethod(AdminUser, "find", () => ({
    lean: async () => [{ _id: "1", name: "Admin", email: "admin@example.com", role: "ADMIN", active: true }]
  }));
  const restoreSetterFind = patchMethod(SetterUser, "find", () => ({ lean: async () => [] }));
  const restoreInvigilatorFind = patchMethod(InvigilatorUser, "find", () => ({ lean: async () => [] }));
  const restoreEnsureDefaultAdminFind = patchMethod(AdminUser, "findOne", async () => ({ _id: "1", email: "admin@example.com", role: "ADMIN", active: true }));

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(Array.isArray(payload), true);
      assert.equal(payload.length, 1);
    });
  } finally {
    restoreAdminFind();
    restoreSetterFind();
    restoreInvigilatorFind();
    restoreEnsureDefaultAdminFind();
  }
});

test("PUT /api/store/systemConfig rejects non-admin writes", async () => {
  const token = createAuthToken({
    _id: "2",
    email: "setter@example.com",
    role: "PAPER_SETTER"
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/store/systemConfig`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value: [] })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Access denied for this resource");
  });
});

test("PUT /api/store/systemConfig allows admin writes", async () => {
  const token = createAuthToken({
    _id: "1",
    email: "admin@example.com",
    role: "ADMIN"
  });
  const restoreDeleteMany = patchMethod(SystemConfig, "deleteMany", async () => ({ acknowledged: true }));
  const restoreInsertMany = patchMethod(SystemConfig, "insertMany", async (docs) => docs);

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/store/systemConfig`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ value: [{ id: "cfg", unlockLeadMinutes: 5 }] })
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.key, "systemConfig");
      assert.equal(Array.isArray(payload.value), true);
    });
  } finally {
    restoreDeleteMany();
    restoreInsertMany();
  }
});

test("POST /api/centers/master rejects invigilator access", async () => {
  const token = createAuthToken({
    _id: "3",
    email: "inv@example.com",
    role: "INVIGILATOR"
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/centers/master`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ centerName: "Main Hall" })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.message, "Access denied for this role");
  });
});

test("GET /api/centers returns wrapped data for authorized role", async () => {
  const token = createAuthToken({
    _id: "1",
    email: "admin@example.com",
    role: "ADMIN"
  });
  const restoreCenterFind = patchMethod(Center, "find", () => ({
    sort: () => ({
      lean: async () => [{ centerName: "Main Hall", institutionName: "ABC College", stats: { totalRequests: 1 } }]
    })
  }));

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/centers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(Array.isArray(payload.data), true);
      assert.equal(payload.data[0].centerName, "Main Hall");
    });
  } finally {
    restoreCenterFind();
  }
});
