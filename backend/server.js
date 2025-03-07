const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://192.168.0.33:3000'], // allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // allowed headers
  credentials: true, // allow cookies or authorization headers
};

// Use CORS middleware before any routes are defined
app.use(cors(corsOptions));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/create-account', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

// User schema and model
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

// POST /create-account endpoint
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

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions)); // Ensure CORS headers for preflight requests

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
