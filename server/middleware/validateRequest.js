import AppError from "../utils/AppError.js";

export const validate = (validator) => (req, _res, next) => {
  try {
    validator(req);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(400, error.message || "Invalid request"));
  }
};
