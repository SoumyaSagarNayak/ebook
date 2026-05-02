// src/server.js
// This is the ENTRY POINT of the backend.
// When you run `npm run dev`, Node.js starts here.

require('dotenv').config(); // Load .env variables first

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { initializeDatabase } = require('./db/database');

// Import all route files
const authRoutes     = require('./routes/authRoutes');
const bookRoutes     = require('./routes/bookRoutes');
const borrowRoutes   = require('./routes/borrowRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// ─────────────────────────────────────────
// 1. Initialize database (creates tables if they don't exist)
// ─────────────────────────────────────────
initializeDatabase();

// ─────────────────────────────────────────
// 2. Create Express app
// ─────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────
// 3. Global Middleware
// These run on EVERY request before reaching routes
// ─────────────────────────────────────────

// CORS: allows your React frontend (localhost:3000) to talk to this backend (localhost:5000)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Parse JSON request bodies (so req.body works)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
// e.g. http://localhost:5000/uploads/mybook.pdf
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─────────────────────────────────────────
// 4. API Routes
// All routes are prefixed with /api
// ─────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/books',      bookRoutes);
app.use('/api/borrow',     borrowRoutes);
app.use('/api/categories', categoryRoutes);

// ─────────────────────────────────────────
// 5. Root health-check endpoint
// Visit http://localhost:5000 to confirm it's running
// ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '📚 E-Book Management API is running!',
    version: '1.0.0',
    endpoints: {
      auth:       '/api/auth',
      books:      '/api/books',
      borrow:     '/api/borrow',
      categories: '/api/categories'
    }
  });
});

// ─────────────────────────────────────────
// 6. Global error handler
// Catches any unhandled errors in route handlers
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on the server.'
  });
});

// ─────────────────────────────────────────
// 7. Start the server
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 API docs: http://localhost:${PORT}\n`);
});
