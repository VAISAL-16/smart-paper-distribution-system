import mongoose from "mongoose";

const invigilatorUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["INVIGILATOR"],
      default: "INVIGILATOR"
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    }
  },
  { timestamps: true }
);

const InvigilatorUser =
  mongoose.models.InvigilatorUser ||
  mongoose.model("InvigilatorUser", invigilatorUserSchema, "invigilators");

export default InvigilatorUser;
