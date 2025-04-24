require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
const corsOptions = {
  origin: ['http://localhost:3000', 'http://15.206.28.128'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// ===== Models =====
const Contact = mongoose.model(
  'Contact',
  new mongoose.Schema({
    businessName: String,
    ownerName: String,
    contactNumber: String,
    email: String,
    businessCategory: String,
    address: String,
    state: String,
    district: String,
    taluka: String,
    pincode: String,
  })
);

const Order = mongoose.model(
  'Order',
  new mongoose.Schema({
    businessName: String,
    ownerName: String,
    contactNumber: String,
    email: String,
    deliveryAddress: String,
    state: String,
    district: String,
    taluka: String,
    pincode: String,
    items: [
      {
        weight: String,
        quantity: Number,
      },
    ],
  })
);

const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  })
);

const Event = mongoose.model(
  'Event',
  new mongoose.Schema({
    id: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    stopTime: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    selectedData: [{ type: String, required: true }],
    expiry: { type: Number, required: true },
    link: { type: String, required: true },
  })
);

// ===== Nodemailer Setup =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ===== Routes =====

// Create Account
app.post('/create-account', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during account creation' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Forgot Password
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not found' });

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

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending email.' });
  }
});

// Reset Password
app.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(400).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

// Submit Contact Form
app.post('/submit-contact', async (req, res) => {
  console.log('📥 Contact form data:', req.body);
  try {
    const contact = new Contact(req.body);
    await contact.save();
    console.log('✅ Contact saved');
    res.status(201).json({ message: 'Contact information saved successfully' });
  } catch (error) {
    console.error('❌ Failed to save contact:', error);
    res.status(500).json({ message: 'Failed to save contact info' });
  }
});

// Submit Order
app.post('/submit-order', async (req, res) => {
  console.log('📥 Order data:', req.body);
  try {
    const order = new Order(req.body);
    await order.save();
    console.log('✅ Order saved');
    res.status(201).json({ message: 'Order saved successfully' });
  } catch (error) {
    console.error('❌ Failed to save order:', error);
    res.status(500).json({ message: 'Failed to save order' });
  }
});

// Submit Event
app.post('/api/events', async (req, res) => {
  console.log('📥 Event submission received:', req.body);

  const { id, date, startTime, stopTime, name, description, selectedData, expiry, link } = req.body;

  if (!id || !date || !startTime || !stopTime || !name || !description || !selectedData || !expiry || !link) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const event = new Event({
      id,
      date,
      startTime,
      stopTime,
      name,
      description,
      selectedData: Array.isArray(selectedData) ? selectedData : [String(selectedData)],
      expiry: Number(expiry),
      link,
    });

    console.log('🧪 Validating event...');
    await event.validate();

    console.log('💾 Saving event to DB...');
    await event.save();

    console.log('✅ Event saved successfully');
    res.status(201).json({ message: 'Event created successfully', link: event.link });
  } catch (error) {
    console.error('❌ Error saving event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Preflight CORS
app.options('*', cors(corsOptions));

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
