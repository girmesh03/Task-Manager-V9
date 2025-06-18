import CustomError from "./CustomError.js";

const handleSpecificErrors = (error) => {
  if (error.name === "CastError") {
    return new CustomError(`Invalid ${error.kind} id`, 400, "RESOURCE-400");
  } else if (error.code === 11000) {
    const key = Object.keys(error.keyValue)[0];
    return new CustomError(`${key} already exists`, 400, "DUPLICATE-400");
  } else if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    const customError = new CustomError(
      "Validation failed",
      400,
      "VALIDATION-400"
    );
    customError.details = errors;
    return customError;
  } else if (error.name === "JsonWebTokenError") {
    return new CustomError("Invalid authentication token", 401, "AUTH-401");
  } else if (error.name === "TokenExpiredError") {
    return new CustomError("Authentication token expired", 401, "AUTH-401");
  }
  return error;
};

const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  const handledError = handleSpecificErrors(error);

  // Log all errors in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[${handledError.timestamp}] ${handledError.message}`, {
      url: req.originalUrl,
      method: req.method,
      stack: handledError.stack,
    });
  }

  // Production error response
  if (process.env.NODE_ENV === "production") {
    if (handledError.isOperational) {
      res.status(handledError.statusCode).json({
        status: handledError.status,
        message: handledError.message,
        ...(handledError.details && { details: handledError.details }),
        errorCode: handledError.errorCode,
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Internal server error",
        errorCode: "SERVER-500",
      });
    }
  } else {
    // Development error response
    res.status(handledError.statusCode).json({
      status: handledError.status,
      message: handledError.message,
      error: handledError,
      stack: handledError.stack,
    });
  }
};

export default globalErrorHandler;
