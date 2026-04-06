function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Lỗi máy chủ",
    errors: err.errors || [],
  };
  if (process.env.NODE_ENV !== "production" && status >= 500) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = errorHandler;
