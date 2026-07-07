export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({ error: err.message ?? 'Internal server error' });
}
