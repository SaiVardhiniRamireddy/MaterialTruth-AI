import multer from 'multer';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : `Upload error: ${err.message}`;
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid identifier';
    console.error('[error:cast]', err.path, err.value, err.stack?.split('\n').slice(0, 5).join(' | '));
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists';
  }

  // Log all unexpected errors (not ApiError with a defined status)
  if (!err.status || status >= 500) {
    console.error('[error]', err.stack || err.message);
    if (env.nodeEnv === 'production') message = 'Internal server error';
  }

  res.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } });
}
