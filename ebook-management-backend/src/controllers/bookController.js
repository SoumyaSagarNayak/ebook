// src/controllers/bookController.js
// All the logic for managing books:
// List, search, get one, add, update, delete

const { getDb } = require('../db/database');

// ─────────────────────────────────────────
// GET ALL BOOKS — GET /api/books
// Supports: search by title/author, filter by category
// Public: anyone can view books (no login needed)
// ─────────────────────────────────────────
function getAllBooks(req, res) {
  const db = getDb();
  const { search, category_id } = req.query; // e.g. /api/books?search=gatsby&category_id=1

  let query = `
    SELECT b.*, c.name AS category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Add search filter if provided
  if (search) {
    query += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Add category filter if provided
  if (category_id) {
    query += ` AND b.category_id = ?`;
    params.push(category_id);
  }

  query += ` ORDER BY b.created_at DESC`;

  const books = db.prepare(query).all(...params);
  res.json({ books, total: books.length });
}

// ─────────────────────────────────────────
// GET ONE BOOK — GET /api/books/:id
// Returns full details for a single book
// ─────────────────────────────────────────
function getBookById(req, res) {
  const db = getDb();
  const book = db.prepare(`
    SELECT b.*, c.name AS category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  res.json({ book });
}

// ─────────────────────────────────────────
// ADD BOOK — POST /api/books
// Admin only. Adds a new book record.
// ─────────────────────────────────────────
function addBook(req, res) {
  const { title, author, description, category_id, total_copies } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required.' });
  }

  const copies = parseInt(total_copies) || 1;
  const db = getDb();

  // If a file was uploaded, multer puts its path in req.file
  const file_path   = req.file ? req.file.path : null;
  const cover_path  = req.body.cover_path || null;

  const result = db.prepare(`
    INSERT INTO books (title, author, description, category_id, file_path, cover_path, total_copies, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, author, description || '', category_id || null, file_path, cover_path, copies, copies);

  res.status(201).json({
    message: 'Book added successfully!',
    book_id: result.lastInsertRowid
  });
}

// ─────────────────────────────────────────
// UPDATE BOOK — PUT /api/books/:id
// Admin only. Edit any field of a book.
// ─────────────────────────────────────────
function updateBook(req, res) {
  const db = getDb();
  const { title, author, description, category_id, total_copies, status } = req.body;

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  // Use existing value if new value not provided (partial update)
  db.prepare(`
    UPDATE books SET
      title         = ?,
      author        = ?,
      description   = ?,
      category_id   = ?,
      total_copies  = ?,
      status        = ?
    WHERE id = ?
  `).run(
    title         || book.title,
    author        || book.author,
    description   ?? book.description,
    category_id   ?? book.category_id,
    total_copies  || book.total_copies,
    status        || book.status,
    req.params.id
  );

  res.json({ message: 'Book updated successfully!' });
}

// ─────────────────────────────────────────
// DELETE BOOK — DELETE /api/books/:id
// Admin only. Removes a book from the system.
// ─────────────────────────────────────────
function deleteBook(req, res) {
  const db = getDb();

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  // Check if any copies are still borrowed
  const borrowed = db.prepare(`
    SELECT COUNT(*) as cnt FROM borrow_records
    WHERE book_id = ? AND status = 'borrowed'
  `).get(req.params.id);

  if (borrowed.cnt > 0) {
    return res.status(400).json({ error: 'Cannot delete book — it has active borrows.' });
  }

  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ message: 'Book deleted successfully.' });
}

module.exports = { getAllBooks, getBookById, addBook, updateBook, deleteBook };
