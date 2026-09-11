export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.statusCode || (err.name === "ValidationError" ? 400 : 500);

  res.status(status).json({
    success: false,
    message:
      err.name === "ValidationError"
        ? Object.values(err.errors).map((e) => e.message).join(", ")
        : err.message || "Internal server error"
  });
}