require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index');
const { initDB } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — only allow requests from the Vite frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// All routes prefixed with /api
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ChamaLoop API is running.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler — catches anything unexpected
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
});

// Initialise database tables then start the server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`ChamaLoop server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialise database:', err.message);
  process.exit(1);
});
