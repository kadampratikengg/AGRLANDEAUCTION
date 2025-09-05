const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const multer = require('multer');
const User = require('../models/User');
const { transporter } = require('../utils/nodemailer');
const router = express.Router();

// Configure multer for FormData
const upload = multer();

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} catch (error) {
  console.error('❌ Razorpay initialization failed:', error.message);
}

// Helper function to generate a unique username
const generateUniqueUsername = async (baseUsername) => {
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}_${counter}`;
    counter++;
  }
  return username;
};

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('📥 Login attempt for email:', email);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    const today = new Date();
    const isValidSubscription = user.subscription?.isValid && new Date(user.subscription.endDate) > today;

    console.log('✅ Login successful for email:', email);
    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      userId: user._id, 
      isValidSubscription,
      subscription: user.subscription ? {
        planDuration: user.subscription.planDuration,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        amount: user.subscription.amount,
        paymentId: user.subscription.paymentId,
        orderId: user.subscription.orderId,
        isValid: user.subscription.isValid
      } : null
    });
  } catch (error) {
    console.error('❌ Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Check Email
router.post('/check-email', express.json(), async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const existingUser = await User.findOne({ email });
    res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check email availability' });
  }
});

// Create Account
router.post('/create-account', upload.none(), async (req, res) => {
  const { email, password, confirmPassword, name, organization, logo, contact, phone, address, state, district, pincode, gstNumber } = req.body;

  try {
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const baseUsername = email.split('@')[0] || `user_${Date.now()}`;
    const username = await generateUniqueUsername(baseUsername);

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      name: name || email.split('@')[0] || 'Default User',
      organization,
      logo,
      contact,
      phone,
      address,
      state,
      district,
      pincode,
      gstNumber
    });

    const savedUser = await newUser.save();

    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(201).json({ message: 'Account created successfully', token, userId: savedUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error during account creation' });
  }
});

// Create Razorpay Order
router.post('/create-order', express.json(), async (req, res) => {
  const { amount, currency } = req.body;
  try {
    const options = { amount, currency: currency || 'INR', receipt: `receipt_${Date.now()}`, payment_capture: 1 };
    const order = await razorpay.orders.create(options);
    res.status(200).json({ order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Verify Payment
router.post('/verify-payment', express.json(), async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, planDuration, amount, validityDays } = req.body;

  try {
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Move current subscription to history if it exists
    if (user.subscription && user.subscription.isValid) {
      user.subscriptionHistory = user.subscriptionHistory || [];
      user.subscriptionHistory.push({
        planDuration: user.subscription.planDuration,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        isValid: user.subscription.isValid,
        amount: user.subscription.amount,
        paymentId: user.subscription.paymentId,
        orderId: user.subscription.orderId
      });
    }

    // Determine start date for new subscription
    const today = new Date();
    let startDate = today;
    if (user.subscription && user.subscription.isValid && new Date(user.subscription.endDate) > today) {
      startDate = new Date(user.subscription.endDate);
      startDate.setDate(startDate.getDate() + 1); // Start the day after the current subscription ends
    }

    // Calculate end date based on validityDays
    const subscriptionEndDate = new Date(startDate);
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + validityDays);

    user.subscription = {
      planDuration,
      startDate,
      endDate: subscriptionEndDate,
      isValid: true,
      amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    };

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({ 
      message: 'Payment verified and subscription updated', 
      token, 
      userId: user._id,
      subscription: {
        planDuration,
        startDate,
        endDate: subscriptionEndDate,
        amount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        isValid: true
      }
    });
  } catch (error) {
    console.error('❌ Payment verification error:', error.message, error.stack);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

module.exports = router;