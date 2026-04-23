const express = require('express');
const router = express.Router();

// Simple health endpoint to check AWS env vars and server readiness
router.get('/api/health/aws', (req, res) => {
  const {
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME,
  } = process.env;
  res.json({
    aws: {
      region: !!AWS_REGION,
      bucket: !!AWS_BUCKET_NAME,
      hasKey: !!AWS_ACCESS_KEY_ID,
      hasSecret: !!AWS_SECRET_ACCESS_KEY,
      regionValue: AWS_REGION || null,
      bucketValue: AWS_BUCKET_NAME || null,
    },
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
