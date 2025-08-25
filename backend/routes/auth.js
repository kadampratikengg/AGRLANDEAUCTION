const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { transporter } = require('../utils/nodemailer');
const router = express.Router();

// Initialize Razorpay
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not defined in environment variables');
  }
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error('❌ Razorpay initialization failed:', error.message);
}

// Check Email Existence
router.post('/check-email', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    console.error('❌ Error checking email:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to check email availability', error: error.message });
  }
});

// Create Account
router.post('/create-account', async (req, res) => {
  const { email, password, confirmPassword, planDuration, validityDays, paymentId, orderId, amount } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + validityDays);

    const newUser = new User({
      email,
      password: hashedPassword,
      subscription: {
        planDuration,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        isValid: true,
        amount,
        paymentId,
        orderId
      }
    });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(201).json({ message: 'Account created successfully', token, userId: newUser._id });
  } catch (error) {
    console.error('❌ Error creating account:', error.message, error.stack);
    res.status(500).json({ message: 'Server error during account creation', error: error.message });
  }
});

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

    const isValidSubscription = user.subscription?.isValid && new Date(user.subscription.endDate) > new Date();

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
        orderId: user.subscription.orderId
      } : null
    });
  } catch (error) {
    console.error('❌ Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    console.log('📥 Processing forgot password for email:', email);

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials are not defined');
      return res.status(500).json({ message: 'Server configuration error: Email credentials are not set' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: 'Email not found' });
    }

    console.log('✅ User found:', user._id);
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. Click here: ${resetLink}`,
    };

    console.log('📧 Sending email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
    res.status(200).json({ message: 'Password reset link sent successfully' });
  } catch (err) {
    console.error('❌ Error sending email:', err.message, err.stack);
    res.status(500).json({ message: 'Error sending email', error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('❌ Error resetting password:', err.message, err.stack);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ message: 'Razorpay configuration error: API keys not set' });
  }

  const { amount, currency, planDuration } = req.body;

  try {
    const options = {
      amount: amount,
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ message: 'Razorpay configuration error: API keys not set' });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, email, userId, planDuration, validityDays, password, confirmPassword, amount } = req.body;

  console.log('Verify payment request body:', req.body);

  try {
    // Validate required payment fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !email || !planDuration || !validityDays) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    // Validate signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    let user;
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + validityDays);

    if (userId) {
      // Update subscription for existing user (PlansPage.js or LoginPage.js)
      user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Update subscription details
      user.subscription = {
        planDuration,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        isValid: true,
        amount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      };
      await user.save();
    } else if (email && password && confirmPassword) {
      // Create new user (CreateAccountPage.js)
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = new User({
        email,
        password: hashedPassword,
        subscription: {
          planDuration,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
          isValid: true,
          amount,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        }
      });
      await user.save();
    } else {
      return res.status(400).json({ message: 'Either userId or email with passwords are required' });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    // Generate and send receipt
    const receipt = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      email,
      planDuration,
      amount,
      date: new Date().toISOString(),
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Payment Receipt - A M Subscription',
          html: `
            <h2>Payment Receipt</h2>
            <p>Thank you for your subscription to A M!</p>
            <p><strong>Payment ID:</strong> ${receipt.paymentId}</p>
            <p><strong>Order ID:</strong> ${receipt.orderId}</p>
            <p><strong>Plan:</strong> ${receipt.planDuration}</p>
            <p><strong>Amount:</strong> ₹${receipt.amount}</p>
            <p><strong>Date:</strong> ${new Date(receipt.date).toLocaleString()}</p>
          `,
        };
        await transporter.sendMail(mailOptions);
        console.log('✅ Receipt email sent to:', email);
      } else {
        console.warn('⚠️ Email credentials not set, skipping receipt email');
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send receipt email:', emailError.message);
      // Continue with response even if email fails
    }

    res.status(200).json({ message: 'Payment verified and subscription updated', token, userId: user._id });
  } catch (error) {
    console.error('❌ Error verifying payment:', error.message, error.stack);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

module.exports = router;