import crypto from "crypto";

export const requestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
