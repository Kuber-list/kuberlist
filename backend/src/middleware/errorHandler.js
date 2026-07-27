export const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const errorHandler = (err, req, res, next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV === 'development' && status === 500) console.error(err);
  res.status(status).json({ success: false, message });
};
