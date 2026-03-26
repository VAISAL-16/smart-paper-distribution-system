import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import AdminUser from "../models/AdminUser.js";
import SetterUser from "../models/SetterUser.js";
import InvigilatorUser from "../models/InvigilatorUser.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error("MONGO_URL is not set in environment.");
  process.exit(1);
}

const resetPassword = async (Model, email, password, role) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);

  const existing = await Model.findOne({ email: normalizedEmail });
  if (existing) {
    existing.password = hash;
    existing.provider = "local";
    existing.role = role;
    existing.active = true;
    await existing.save();
    console.log(`Updated ${role} password for ${normalizedEmail}`);
    return;
  }

  await Model.create({
    name: normalizedEmail.split("@")[0] || role,
    email: normalizedEmail,
    password: hash,
    role,
    active: true,
    provider: "local"
  });
  console.log(`Created ${role} user for ${normalizedEmail}`);
};

const run = async () => {
  await mongoose.connect(MONGO_URL);
  await resetPassword(AdminUser, "vaisal16122005@gmail.com", "1612", "ADMIN");
  await resetPassword(InvigilatorUser, "vaisalpro16@gmail.com", "1612", "INVIGILATOR");
  await resetPassword(SetterUser, "vaisal.cs23@bitsathy.ac.in", "1612", "PAPER_SETTER");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
