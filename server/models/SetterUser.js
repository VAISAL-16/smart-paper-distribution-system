import mongoose from "mongoose";

const setterUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["PAPER_SETTER"],
      default: "PAPER_SETTER"
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    }
  },
  { timestamps: true }
);

const SetterUser =
  mongoose.models.SetterUser ||
  mongoose.model("SetterUser", setterUserSchema, "setters");

export default SetterUser;
