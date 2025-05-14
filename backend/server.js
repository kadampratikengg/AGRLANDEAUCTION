require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Undefined');

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Ensure Uploads Directory Exists =====
const uploadPath = './Uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// ===== Middleware =====
const corsOptions = {
  origin: ['http://localhost:3000', 'http://15.206.28.128'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next();
});

// ===== File Storage Configuration =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    if (!file || !file.originalname) {
      return cb(new Error('No file or invalid file name provided'), null);
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, false);
    }
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

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
    selectedData: [
      {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    ],
    fileData: { type: Array, required: false }, // Store Excel data
    candidateImages: [
      {
        candidateIndex: Number,
        imagePath: String,
      },
    ],
    expiry: { type: Number, required: true },
    link: { type: String, required: true },
  })
);

const Vote = mongoose.model(
  'Vote',
  new mongoose.Schema({
    eventId: { type: String, required: true },
    voterId: { type: String, required: true },
    candidate: { type: String, required: true },
    timestamp: { type: String, required: true },
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

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: '✅ Backend is running' });
});

// Fetch all active events
app.get('/api/events', async (req, res) => {
  console.log('📥 Fetching all active events');
  try {
    const currentTime = Date.now();
    const events = await Event.find({ expiry: { $gt: currentTime } });
    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

// Fetch votes for an event
app.get('/api/votes/:eventId', async (req, res) => {
  console.log('📥 Fetching votes for event:', req.params.eventId);
  try {
    const votes = await Vote.find({ eventId: req.params.eventId });
    res.status(200).json(votes);
  } catch (error) {
    console.error('❌ Error fetching votes:', error);
    res.status(500).json({ message: 'Failed to fetch votes', error: error.message });
  }
});

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
    console.error('❌ Error creating account:', error);
    res.status(500).json({ message: 'Server error during account creation' });
  }
});

// Login
app.post('/login', async (req, res) => {
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

    console.log('✅ Login successful for email:', email);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('❌ Login error:', error.stack);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Forgot Password
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    console.log('📥 Processing forgot-password for email:', email);

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    // Check email credentials
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
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('❌ Error sending password reset email:', err.stack);
    res.status(500).json({ message: 'Error sending email.', error: err.message });
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
    console.error('❌ Error resetting password:', err);
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

// Store Excel Data in Event
app.post('/api/excel-data', async (req, res) => {
  console.log('📥 Excel data submission received:', req.body);

  const { eventId, fileData, timestamp } = req.body;

  if (!eventId || !fileData || !timestamp) {
    return res.status(400).json({ message: 'Missing required fields: eventId, fileData, timestamp' });
  }

  try {
    // Update the event with new fileData, overwriting the old one
    const event = await Event.findOneAndUpdate(
      { id: eventId },
      { $set: { fileData, timestamp } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('✅ Excel data updated for event:', event);
    res.status(201).json({ message: 'Excel data updated successfully' });
  } catch (error) {
    console.error('❌ Error updating Excel data:', error);
    res.status(500).json({ message: 'Failed to update Excel data', error: error.message });
  }
});

// Verify ID
app.post('/api/verify-id/:eventId', async (req, res) => {
  console.log('📥 ID verification request for event:', req.params.eventId, ' Cause I am ID:', req.body.id);

  const { id } = req.body;
  const eventId = req.params.eventId;

  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  try {
    const event = await Event.findOne({ id: eventId });
    console.log('🔍 Event found:', event);
    if (!event || !event.fileData) {
      return res.status(404).json({ message: 'No Excel data found for this event' });
    }

    const rowData = event.fileData.find((row) => {
      const values = Object.values(row);
      return values.length >= 2 && (values[1] === id || String(values[1]) === String(id));
    });

    console.log('🔍 RowData found:', rowData);
    if (!rowData) {
      return res.status(200).json({ message: 'ID not found in second column of Excel data', verified: false });
    }

    res.status(200).json({ verified: true, rowData });
  } catch (error) {
    console.error('❌ Error verifying ID:', error);
    res.status(500).json({ message: 'Failed to verify ID', error: error.message });
  }
});

// Submit Vote
app.post('/api/vote/:eventId', async (req, res) => {
  console.log('📥 Vote submission for event:', req.params.eventId, 'Data:', req.body);

  const { voterId, candidate } = req.body;
  const eventId = req.params.eventId;

  if (!voterId || !candidate) {
    return res.status(400).json({ message: 'Voter ID and candidate are required' });
  }

  try {
    const existingVote = await Vote.findOne({ eventId, voterId });
    if (existingVote) {
      return res.status(400).json({ message: 'This ID has already voted' });
    }

    const vote = new Vote({
      eventId,
      voterId,
      candidate,
      timestamp: new Date().toISOString(),
    });

    await vote.save();
    console.log('✅ Vote saved successfully:', vote);
    res.status(201).json({ message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('❌ Error saving vote:', error);
    res.status(500).json({ message: 'Failed to submit vote', error: error.message });
  }
});

// Get Event
app.get('/api/events/:id', async (req, res) => {
  console.log('📥 Event fetch request for ID:', req.params.id);

  try {
    const event = await Event.findOne({ id: req.params.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

// Create Event
app.post('/api/events', upload.array('images', 10), async (req, res) => {
  console.log('📥 Event submission received:', {
    body: req.body,
    files: req.files ? req.files.map(file => ({ originalname: file.originalname, path: file.path })) : [],
  });

  const {
    id,
    date,
    startTime,
    stopTime,
    name,
    description,
    selectedData,
    candidateImages,
    expiry,
    link,
    fileData,
  } = req.body;

  const missingFields = [];
  if (!id) missingFields.push('id');
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!stopTime) missingFields.push('stopTime');
  if (!name) missingFields.push('name');
  if (!description) missingFields.push('description');
  if (!selectedData) missingFields.push('selectedData');
  if (!expiry) missingFields.push('expiry');
  if (!link) missingFields.push('link');

  if (missingFields.length > 0) {
    console.error('❌ Missing fields:', missingFields);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    let parsedSelectedData, parsedCandidateImages, parsedFileData;
    try {
      parsedSelectedData = JSON.parse(selectedData);
      parsedCandidateImages = candidateImages ? JSON.parse(candidateImages) : [];
      parsedFileData = fileData ? JSON.parse(fileData) : [];
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      return res.status(400).json({ message: 'Invalid JSON format in selectedData, candidateImages, or fileData' });
    }

    if (!Array.isArray(parsedSelectedData) || parsedSelectedData.length === 0) {
      console.error('❌ Invalid selectedData:', parsedSelectedData);
      return res.status(400).json({ message: 'selectedData must be a non-empty array' });
    }

    const imagePaths = req.files && req.files.length > 0
      ? req.files.map((file, index) => ({
          candidateIndex: parsedCandidateImages[index]?.candidateIndex ?? index,
          imagePath: file.path,
        }))
      : parsedCandidateImages;

    const event = new Event({
      id,
      date,
      startTime,
      stopTime,
      name,
      description,
      selectedData: parsedSelectedData,
      fileData: parsedFileData,
      candidateImages: imagePaths,
      expiry: Number(expiry),
      link,
    });

    console.log('🧪 Validating event:', event);
    await event.validate();

    console.log('💾 Saving event to DB...');
    await event.save();

    console.log('✅ Event saved successfully:', event);
    res.status(201).json({ message: 'Event created successfully', link: event.link });
  } catch (error) {
    console.error('❌ Error saving event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Update Event
app.put('/api/events/:id', upload.array('images', 10), async (req, res) => {
  console.log('📥 Event update request for ID:', req.params.id, 'Data:', {
    body: req.body,
    files: req.files ? req.files.map(file => ({ originalname: file.originalname, path: file.path })) : [],
  });

  const {
    date,
    startTime,
    stopTime,
    name,
    description,
    selectedData,
    candidateImages,
    expiry,
    link,
    fileData,
  } = req.body;

  const missingFields = [];
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!stopTime) missingFields.push('stopTime');
  if (!name) missingFields.push('name');
  if (!description) missingFields.push('description');
  if (!selectedData) missingFields.push('selectedData');
  if (!expiry) missingFields.push('expiry');
  if (!link) missingFields.push('link');

  if (missingFields.length > 0) {
    console.error('❌ Missing fields:', missingFields);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    let parsedSelectedData, parsedCandidateImages, parsedFileData;
    try {
      parsedSelectedData = JSON.parse(selectedData);
      parsedCandidateImages = candidateImages ? JSON.parse(candidateImages) : [];
      parsedFileData = fileData ? JSON.parse(fileData) : [];
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      return res.status(400).json({ message: 'Invalid JSON format in selectedData, candidateImages, or fileData' });
    }

    if (!Array.isArray(parsedSelectedData) || parsedSelectedData.length === 0) {
      console.error('❌ Invalid selectedData:', parsedSelectedData);
      return res.status(400).json({ message: 'selectedData must be a non-empty array' });
    }

    const imagePaths = req.files && req.files.length > 0
      ? req.files.map((file, index) => ({
          candidateIndex: parsedCandidateImages[index]?.candidateIndex ?? index,
          imagePath: file.path,
        }))
      : parsedCandidateImages;

    // Delete old images
    const existingEvent = await Event.findOne({ id: req.params.id });
    if (existingEvent && existingEvent.candidateImages) {
      existingEvent.candidateImages.forEach((image) => {
        if (image.imagePath && fs.existsSync(image.imagePath)) {
          fs.unlinkSync(image.imagePath);
        }
      });
    }

    // Update event with new fileData, overwriting the old one
    const event = await Event.findOneAndUpdate(
      { id: req.params.id },
      {
        date,
        startTime,
        stopTime,
        name,
        description,
        selectedData: parsedSelectedData,
        fileData: parsedFileData, // Overwrite old fileData
        candidateImages: imagePaths,
        expiry: Number(expiry),
        link,
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      console.error('❌ Event not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('✅ Event updated successfully:', event);
    res.status(200).json({ message: 'Event updated successfully', link: event.link });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

// Delete Event
app.delete('/api/events/:id', async (req, res) => {
  console.log('📥 Event deletion request for ID:', req.params.id);

  try {
    const event = await Event.findOneAndDelete({ id: req.params.id });

    if (!event) {
      console.error('❌ Event not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete associated images
    if (event.candidateImages) {
      event.candidateImages.forEach((image) => {
        if (image.imagePath && fs.existsSync(image.imagePath)) {
          fs.unlinkSync(image.imagePath);
        }
      });
    }

    // Note: fileData is removed automatically as the entire event document is deleted
    console.log('✅ Event and associated fileData deleted successfully:', event);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

// Serve uploaded files
app.use('/Uploads', express.static('Uploads'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});