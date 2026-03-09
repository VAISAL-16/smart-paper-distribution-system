import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import SetterUser from "../models/SetterUser.js";
import InvigilatorUser from "../models/InvigilatorUser.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getRoleModel = (role) => {
  if (role === "PAPER_SETTER") return SetterUser;
  if (role === "INVIGILATOR") return InvigilatorUser;
  return null;
};

const verifyGoogleIdToken = async (token) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured on server");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const verifiedEmail = String(payload?.email || "").trim().toLowerCase();
  const verifiedName = String(payload?.name || "").trim();

  if (!verifiedEmail || !verifiedName) {
    throw new Error("Invalid Google token payload");
  }

  return { email: verifiedEmail, name: verifiedName };
};

const findUserByEmail = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const setter = await SetterUser.findOne({ email: normalizedEmail });
  if (setter) return setter;

  const invigilator = await InvigilatorUser.findOne({ email: normalizedEmail });
  if (invigilator) return invigilator;

  return null;
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole = String(role || "").trim().toUpperCase();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();

    if (!normalizedName || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    const Model = getRoleModel(normalizedRole);
    if (!Model) {
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
      role: normalizedRole,
      provider: "local"
    });

    return res.status(201).json({
      message: "User registered",
      user: {
        id: created._id,
        name: created.name,
        email: created.email,
        role: created.role
      }
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
        user: {
          id: existing._id,
          name: existing.name,
          email: existing.email,
          role: existing.role
        }
      });
    }

    if (!normalizedRole) {
      return res
        .status(404)
        .json({ message: "Account not found. Please sign up and select a role first." });
    }

    const Model = getRoleModel(normalizedRole);
    if (!Model) {
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
      user: {
        id: created._id,
        name: created.name,
        email: created.email,
        role: created.role
      }
    });
  } catch (error) {
    return res.status(401).json({ message: "Google authentication failed", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.provider === "google") {
      return res.status(401).json({ message: "Use Google sign-in for this account" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || "");
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};
