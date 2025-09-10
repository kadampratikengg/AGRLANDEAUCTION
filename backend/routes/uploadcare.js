// routes/uploadcare.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.delete('/delete/:uuid', authenticateToken, async (req, res) => {
  const { uuid } = req.params;
  const uploadcarePublicKey = process.env.UPLOADCARE_PUBLIC_KEY;
  const uploadcareSecretKey = process.env.UPLOADCARE_SECRET_KEY;

  if (!uploadcarePublicKey || !uploadcareSecretKey) {
    console.error('❌ Uploadcare credentials missing');
    return res.status(500).json({ message: 'Uploadcare credentials not configured' });
  }

  try {
    await axios.delete(`https://api.uploadcare.com/files/${uuid}/`, {
      headers: {
        Authorization: `Uploadcare.Simple ${uploadcarePublicKey}:${uploadcareSecretKey}`,
        Accept: 'application/vnd.uploadcare-v0.7+json',
      },
    });
    console.log(`🗑️ Image deleted from Uploadcare: ${uuid}`);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting image from Uploadcare:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Image not found in Uploadcare' });
    }
    res.status(500).json({ message: 'Failed to delete image from Uploadcare', error: error.message });
  }
});

module.exports = router;