const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Contact Form schema and model
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

// Order Form schema and model
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

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://15.206.28.128'], // allowed origin for React app
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // allowed headers
  credentials: true, // allow cookies or authorization headers
};

// Use CORS middleware before any routes are defined
app.use(cors(corsOptions));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/create-account', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

// User schema and model
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  })
);

// Nodemailer setup for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com', // Replace with your email
    pass: 'your_password', // Replace with your email password
  },
});

// POST /create-account endpoint for account creation
app.post('/create-account', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: 'Account created successfully' });
});

// POST /login endpoint for user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Successful login
  res.status(200).json({ message: 'Login successful' });
});

// POST /forgot-password endpoint for sending password reset email
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Check if user exists in the database
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Email not found' });
  }

  // Generate password reset token (valid for 1 hour)
  const resetToken = jwt.sign({ userId: user._id }, 'your-secret-key', {
    expiresIn: '1h',
  });

  // Send reset email with the token
  const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
  const mailOptions = {
    from: 'your_email@gmail.com', // Replace with your email
    to: email,
    subject: 'Password Reset',
    text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}`,
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error sending email. Please try again later.' });
  }
});

// POST /reset-password endpoint for handling password reset
app.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(resetToken, 'your-secret-key');
    const userId = decoded.userId;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

// POST /submit-contact endpoint
app.post('/submit-contact', async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      contactNumber,
      email,
      businessCategory,
      address,
      state,
      district,
      taluka,
      pincode,
    } = req.body;

    const newContact = new Contact({
      businessName,
      ownerName,
      contactNumber,
      email,
      businessCategory,
      address,
      state,
      district,
      taluka,
      pincode,
    });

    await newContact.save();
    res.status(201).json({ message: 'Contact information saved successfully' });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ message: 'Failed to save contact info' });
  }
});

// POST /submit-order endpoint
app.post('/submit-order', async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      contactNumber,
      email,
      deliveryAddress,
      state,
      district,
      taluka,
      pincode,
      items,
    } = req.body;

    const newOrder = new Order({
      businessName,
      ownerName,
      contactNumber,
      email,
      deliveryAddress,
      state,
      district,
      taluka,
      pincode,
      items,
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order saved successfully' });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ message: 'Failed to save order' });
  }
});

// handleContactFormSubmit
fetch('http://15.206.28.128:5000/submit-contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessName,
    ownerName,
    contactNumber,
    email,
    businessCategory,
    address: `${selectedTaluka}, ${selectedDistrict}, ${selectedState}, India - ${pincode}`,
    state: selectedState,
    district: selectedDistrict,
    taluka: selectedTaluka,
    pincode,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    alert(data.message);
    setShowContactForm(false);
    resetContactForm();
  })
  .catch((err) => {
    console.error('Error submitting contact:', err);
    alert('Failed to submit contact');
  });

// handleOrderFormSubmit
fetch('http://15.206.28.128:5000/submit-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessName,
    ownerName,
    contactNumber,
    email,
    deliveryAddress: `${selectedTaluka}, ${selectedDistrict}, ${selectedState}, India - ${pincode}`,
    state: selectedState,
    district: selectedDistrict,
    taluka: selectedTaluka,
    pincode,
    items: orderItems,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    alert(data.message);
    setShowOrderForm(false);
    resetOrderForm();
  })
  .catch((err) => {
    console.error('Error submitting order:', err);
    alert('Failed to submit order');
  });

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions)); // Ensure CORS headers for preflight requests

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
