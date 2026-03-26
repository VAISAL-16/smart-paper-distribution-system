import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
