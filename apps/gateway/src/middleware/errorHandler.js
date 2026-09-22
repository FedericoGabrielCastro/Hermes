export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: status >= 500 ? "Internal Server Error" : err.message || "Error",
    message:
      status >= 500
        ? "Something went wrong while processing the request."
        : err.message,
    requestId: req.requestId,
  };

  if (process.env.NODE_ENV !== "production" && status >= 500) {
    payload.detail = err.message;
  }

  console.error(`[gateway] ${req.requestId || "-"}`, err);
  res.status(status).json(payload);
}
