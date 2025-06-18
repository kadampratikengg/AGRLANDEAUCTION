const express = require('express');
const Contact = require('../models/Contact');
const router = express.Router();

router.post('/submit', async (req, res) => {
  console.log('📥 Contact form data:', req.body);
  try {
    const contact = new Contact(req.body);
    await contact.save();
    console.log('✅ Contact saved');
    res.status(201).json({ message: 'Contact information saved successfully' });
  } catch (error) {
    console.error('❌ Error saving contact:', error);
    res.status(500).json({ message: 'Failed to save contact info' });
  }
});

module.exports = router;