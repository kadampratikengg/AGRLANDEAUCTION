const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  console.error('❌ Global error:', err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
};

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer error:', err.message, 'Field:', err.field);
    return res.status(400).json({ message: `Multer error: ${err.message}`, field: err.field });
  }
  next(err);
};

module.exports = { errorHandler, multerErrorHandler };