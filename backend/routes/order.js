const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

router.post('/submit', async (req, res) => {
  console.log('📥 Order data:', req.body);
  try {
    const order = new Order(req.body);
    await order.save();
    console.log('✅ Order saved');
    res.status(201).json({ message: 'Order saved successfully' });
  } catch (error) {
    console.error('❌ Error saving order:', error);
    res.status(500).json({ message: 'Failed to save order' });
  }
});

module.exports = router;