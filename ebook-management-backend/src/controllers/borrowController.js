// src/controllers/borrowController.js
// Manages the entire borrowing lifecycle:
// Borrow a book → Return it → View history

const { getDb } = require('../db/database');

// ─────────────────────────────────────────
// BORROW A BOOK — POST /api/borrow
// Logged-in user borrows a book for 14 days
// ─────────────────────────────────────────
function borrowBook(req, res) {
  const { book_id } = req.body;
  const user_id = req.user.id; // comes from JWT token via verifyToken middleware

  if (!book_id) {
    return res.status(400).json({ error: 'book_id is required.' });
  }

  const db = getDb();

  // 1. Check if book exists
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  // 2. Check availability
  if (book.available <= 0) {
    return res.status(400).json({ error: 'No copies available right now. Try again later.' });
  }

  // 3. Check if user already has this book borrowed
  const alreadyBorrowed = db.prepare(`
    SELECT id FROM borrow_records
    WHERE user_id = ? AND book_id = ? AND status = 'borrowed'
  `).get(user_id, book_id);

  if (alreadyBorrowed) {
    return res.status(400).json({ error: 'You already have this book borrowed.' });
  }

  // 4. Calculate due date (14 days from today)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const dueDateStr = dueDate.toISOString().split('T')[0]; // format: YYYY-MM-DD

  // 5. Use a transaction so both operations succeed OR both fail together
  //    (prevents data inconsistency if something crashes mid-way)
  const borrowTransaction = db.transaction(() => {
    // Create borrow record
    const record = db.prepare(`
      INSERT INTO borrow_records (user_id, book_id, due_date)
      VALUES (?, ?, ?)
    `).run(user_id, book_id, dueDateStr);

    // Decrement available copies
    db.prepare(`
      UPDATE books SET available = available - 1,
      status = CASE WHEN available - 1 = 0 THEN 'unavailable' ELSE 'available' END
      WHERE id = ?
    `).run(book_id);

    return record.lastInsertRowid;
  });

  const recordId = borrowTransaction();

  res.status(201).json({
    message: `Book borrowed successfully! Due date: ${dueDateStr}`,
    borrow_record_id: recordId,
    due_date: dueDateStr
  });
}

// ─────────────────────────────────────────
// RETURN A BOOK — PUT /api/borrow/:id/return
// Marks the borrow record as returned
// ─────────────────────────────────────────
function returnBook(req, res) {
  const user_id = req.user.id;
  const db = getDb();

  const record = db.prepare(`
    SELECT * FROM borrow_records WHERE id = ? AND status = 'borrowed'
  `).get(req.params.id);

  if (!record) {
    return res.status(404).json({ error: 'Borrow record not found or already returned.' });
  }

  // Users can only return their own books; admins can return any
  if (record.user_id !== user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only return your own books.' });
  }

  // Calculate dynamic fine at return time
  const dueDate = new Date(record.due_date);
  const returnedDate = new Date();
  dueDate.setHours(0, 0, 0, 0);
  returnedDate.setHours(0, 0, 0, 0);
  const diffTime = returnedDate - dueDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const fine = diffDays > 0 ? diffDays * 5 : 0;

  const fine_message = fine > 0
    ? `Book returned. Overdue fine of ₹${fine} has been recorded.`
    : 'Book returned successfully. Thank you!';

  const returnTransaction = db.transaction(() => {
    // Mark record as returned
    db.prepare(`
      UPDATE borrow_records
      SET status = 'returned', returned_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    // Increment available copies back
    db.prepare(`
      UPDATE books SET available = available + 1, status = 'available'
      WHERE id = ?
    `).run(record.book_id);
  });

  returnTransaction();

  res.json({ message: fine_message, fine_message });
}

// ─────────────────────────────────────────
// MY BORROW HISTORY — GET /api/borrow/my-history
// Shows a user's own borrow records
// ─────────────────────────────────────────
function getMyHistory(req, res) {
  const db = getDb();
  const records = db.prepare(`
    SELECT br.*, b.title, b.author, b.cover_path
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.user_id = ?
    ORDER BY br.borrowed_at DESC
  `).all(req.user.id);

  const mapped = records.map(r => {
    const dueDate = new Date(r.due_date);
    const returnedDate = r.returned_at ? new Date(r.returned_at) : new Date();
    dueDate.setHours(0, 0, 0, 0);
    returnedDate.setHours(0, 0, 0, 0);
    const diffTime = returnedDate - dueDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const fine_amount = diffDays > 0 ? diffDays * 5 : 0;
    return { ...r, fine_amount };
  });

  res.json({ records: mapped });
}

// ─────────────────────────────────────────
// ALL BORROWS — GET /api/borrow/all (Admin)
// Admin sees every borrow record in the system
// ─────────────────────────────────────────
function getAllBorrows(req, res) {
  const db = getDb();
  const records = db.prepare(`
    SELECT br.*, b.title AS book_title, u.name AS user_name, u.email AS user_email
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    JOIN users u ON br.user_id = u.id
    ORDER BY br.borrowed_at DESC
  `).all();

  res.json({ records, total: records.length });
}

module.exports = { borrowBook, returnBook, getMyHistory, getAllBorrows };
