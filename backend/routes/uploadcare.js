// routes/uploadcare.js (repurposed for S3 object deletion)
const express = require('express');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Delete an uploaded object from S3. Accepts either an object key or a full URL.
router.delete('/delete/:keyOrUrl', authenticateToken, async (req, res) => {
  const { keyOrUrl } = req.params;

  if (!process.env.AWS_BUCKET_NAME) {
    console.error('❌ AWS_BUCKET_NAME not configured');
    return res.status(500).json({ message: 'S3 credentials not configured' });
  }

  const extractKey = (val) => {
    if (!val) return val;
    if (val.startsWith('http')) {
      const parts = val.split('/');
      return parts.slice(3).join('/');
    }
    return val;
  };

  const key = extractKey(decodeURIComponent(keyOrUrl));

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );
    console.log(`🗑️ Deleted image from S3: ${key}`);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting object from S3:', error.message || error);
    res
      .status(500)
      .json({
        message: 'Failed to delete object from S3',
        error: error.message,
      });
  }
});

module.exports = router;
