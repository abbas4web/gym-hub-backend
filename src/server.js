const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const connectDB = require('./config/db');
// Only connect immediately if not in production (or if you want to connect on startup)
// In Vercel serverless, it's often better to connect inside the handler or ensure connection is cached.
// But calling it here is generally fine if the connection logic handles buffering/caching.
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/super-admin', require('./routes/superAdmin'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Gym Hub API is running. Access endpoints at /api/...' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Gym Hub API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// Start server - listen on all network interfaces (0.0.0.0) to allow mobile device connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.100.4:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;
