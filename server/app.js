import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import storeRoutes from "./routes/storeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import centerRoutes from "./routes/centerRoutes.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { sendSuccess } from "./utils/apiResponse.js";

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin,
      credentials: true
    })
  );
  app.use(requestContext);
  app.use(express.json({ limit: env.requestBodyLimit }));

  app.get("/", (_req, res) => {
    sendSuccess(res, { service: "Smart Exam Distribution API" }, "API running");
  });

  app.get("/health", (_req, res) => {
    sendSuccess(
      res,
      {
        status: "ok",
        environment: env.nodeEnv,
        uptimeSeconds: Math.round(process.uptime())
      },
      "Health check passed"
    );
  });

  app.use("/api/store", storeRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/centers", centerRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
