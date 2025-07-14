// backend/errorHandler/ErrorController.js
import CustomError from "./CustomError.js";

const handleSpecificErrors = (error) => {
  if (error.name === "CastError") {
    return new CustomError(
      `Invalid ${error.path} identifier`,
      400,
      "INVALID_ID"
    );
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new CustomError(`${field} already exists`, 400, "DUPLICATE_FIELD");
  }
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((el) => el.message);
    return new CustomError(
      `Validation failed: ${errors.join(". ")}`,
      400,
      "VALIDATION_FAILED"
    );
  }
  return error;
};

const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  const handledError = handleSpecificErrors(error);

  res.status(handledError.statusCode).json({
    status: handledError.status,
    message: handledError.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: handledError.stack,
    }),
    errorCode: handledError.errorCode,
  });
};

export default globalErrorHandler;
