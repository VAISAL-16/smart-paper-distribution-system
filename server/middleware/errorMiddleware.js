import AppError from "../utils/AppError.js";

export const notFoundHandler = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: res.locals.requestId
  });

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : "Internal server error";

  if (!(error instanceof AppError)) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    details: error instanceof AppError ? error.details : undefined,
    requestId: res.locals.requestId
  });
};
