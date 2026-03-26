import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  if (!env.mongoUrl) {
    throw new Error("MONGO_URL is not configured");
  }

  const conn = await mongoose.connect(env.mongoUrl);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

export default connectDB;
