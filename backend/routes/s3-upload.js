const express = require('express');
const multer = require('multer');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
// Allow uploads without authentication for initial account creation.
// For profile/sub-user uploads from the UI we still include Authorization header.

const router = express.Router();
const upload = multer();
const allowedFolders = new Set([
  'organization-images',
  'sub-user-images',
  'voting-candidate-images',
]);

// Upload file to S3 and return public URL and object key
router.post('/api/upload/s3', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Validate AWS configuration early so client gets a clear error
    const {
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_BUCKET_NAME,
    } = process.env;
    if (
      !AWS_REGION ||
      !AWS_ACCESS_KEY_ID ||
      !AWS_SECRET_ACCESS_KEY ||
      !AWS_BUCKET_NAME
    ) {
      console.error('❌ Missing AWS S3 configuration:', {
        AWS_REGION,
        AWS_BUCKET_NAME,
        hasKey: !!AWS_ACCESS_KEY_ID,
      });
      return res
        .status(500)
        .json({
          message: 'Server S3 configuration missing. Check AWS env vars.',
        });
    }

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const requestedFolder =
      typeof req.body.folder === 'string' ? req.body.folder.trim() : '';
    const folder = allowedFolders.has(requestedFolder)
      ? requestedFolder
      : 'misc';

    // sanitize key to avoid problematic characters
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${Date.now()}_${safeName}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    const result = await s3Client.send(putCommand);
    // Success — construct public URL (best-effort)
    const url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    const proxyUrl = `/api/upload/s3/object/${encodeURIComponent(key)}`;
    res.status(200).json({ url, key, proxyUrl, result });
  } catch (error) {
    console.error(
      '❌ S3 upload failed:',
      error && error.stack ? error.stack : error,
    );
    // If AWS SDK returned a structured error, include code for easier debugging
    const code = error?.name || error?.Code || null;
    res
      .status(500)
      .json({
        message: 'S3 upload failed',
        error: error?.message || String(error),
        code,
      });
  }
});

router.get('/api/upload/s3/object/:key(*)', async (req, res) => {
  try {
    const {
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_BUCKET_NAME,
    } = process.env;
    if (
      !AWS_REGION ||
      !AWS_ACCESS_KEY_ID ||
      !AWS_SECRET_ACCESS_KEY ||
      !AWS_BUCKET_NAME
    ) {
      return res
        .status(500)
        .json({ message: 'Server S3 configuration missing. Check AWS env vars.' });
    }

    const rawKey = decodeURIComponent(req.params.key || '');
    if (!rawKey) {
      return res.status(400).json({ message: 'Object key is required' });
    }

    let key = rawKey;
    if (/^https?:\/\//i.test(rawKey)) {
      const parsed = new URL(rawKey);
      key = parsed.pathname.replace(/^\/+/, '');
    }

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: key,
      }),
    );

    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.Body.pipe(res);
  } catch (error) {
    console.error('Error fetching S3 object:', error && error.stack ? error.stack : error);
    res.status(404).json({ message: 'Failed to fetch image' });
  }
});

module.exports = router;
