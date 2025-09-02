require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const orderRoutes = require('./routes/order');
const eventRoutes = require('./routes/event');
const profileRoutes = require('./routes/profile');
const subUserRoutes = require('./routes/sub-users');
const { errorHandler, multerErrorHandler } = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure Uploads Directory Exists
const uploadPath = './Uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000']; // Fallback to localhost if not defined

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(multerErrorHandler); // Add multer error handling middleware

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: '✅ Backend is running' });
});
app.use('/', authRoutes); // Auth routes at root (e.g., /login, /create-account, /create-order, /verify-payment)
app.use('/', orderRoutes); // Order routes at root (e.g., /submit-order)
app.use('/api/contact', contactRoutes);
app.use('/api', eventRoutes);
app.use('/', profileRoutes); // Profile routes (e.g., /api/users)
app.use('/', subUserRoutes); // Sub-user routes (e.g., /api/sub-users)

// Serve uploaded files
app.use('/Uploads', express.static('Uploads'));

// Handle 404 errors with JSON response
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});