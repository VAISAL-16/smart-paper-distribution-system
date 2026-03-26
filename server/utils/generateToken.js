import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAuthToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id || user.id),
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

export const verifyAuthToken = (token) => jwt.verify(token, env.jwtSecret);
