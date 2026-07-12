// src/db/database.js
// This file sets up our SQLite database.
// Think of this as creating the "skeleton" of our data storage.

const Database = require('better-sqlite3');
const path = require('path');

// The database will be saved as a file called "ebook.db" in the project root
const DB_PATH = path.join(__dirname, '../../ebook.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Makes SQLite faster
    db.pragma('foreign_keys = ON');  // Enforces relationships between tables
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();

  // ─────────────────────────────────────────
  // TABLE 1: users
  // Stores everyone who uses the system
  // ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'user',  -- 'admin' or 'user'
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─────────────────────────────────────────
  // TABLE 2: categories
  // Book genres like Fiction, Science, History
  // ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL UNIQUE
    )
  `);

  // ─────────────────────────────────────────
  // TABLE 3: books
  // The main table — all ebook records
  // ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      author        TEXT    NOT NULL,
      description   TEXT,
      category_id   INTEGER REFERENCES categories(id),
      file_path     TEXT,                          -- path to uploaded PDF
      cover_path    TEXT,                          -- path to cover image
      total_copies  INTEGER NOT NULL DEFAULT 1,
      available     INTEGER NOT NULL DEFAULT 1,    -- copies currently available
      status        TEXT    NOT NULL DEFAULT 'available', -- available | unavailable
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─────────────────────────────────────────
  // TABLE 4: borrow_records
  // Tracks who borrowed which book and when
  // ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      book_id     INTEGER NOT NULL REFERENCES books(id),
      borrowed_at TEXT NOT NULL DEFAULT (datetime('now')),
      due_date    TEXT NOT NULL,                   -- 14 days after borrowing
      returned_at TEXT,                            -- NULL means still borrowed
      status      TEXT NOT NULL DEFAULT 'borrowed' -- borrowed | returned | overdue
    )
  `);

  // ─────────────────────────────────────────
  // SEED DATA: Insert sample data so the
  // app has something to show when you start
  // ─────────────────────────────────────────
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (userCount.cnt === 0) {
    // Create admin user (password: admin123)
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin User', 'admin@ebook.com', 'admin123', 'admin')
    `).run();

    // Create regular user (password: user123)
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES ('John Doe', 'john@example.com', 'user123', 'user')
    `).run();

    // Seed categories
    const categories = ['Fiction', 'Science', 'History', 'Technology', 'Self-Help', 'Biography'];
    const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
    categories.forEach(cat => insertCat.run(cat));

    // Seed sample books
    const books = [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', description: 'A story of the fabulously wealthy Jay Gatsby.', category_id: 1, total_copies: 3, available: 3 },
      { title: 'A Brief History of Time', author: 'Stephen Hawking', description: 'Explores cosmology for general readers.', category_id: 2, total_copies: 2, available: 2 },
      { title: 'Clean Code', author: 'Robert C. Martin', description: 'A guide to writing readable, maintainable code.', category_id: 4, total_copies: 5, available: 5 },
      { title: 'Sapiens', author: 'Yuval Noah Harari', description: 'A brief history of humankind.', category_id: 3, total_copies: 4, available: 4 },
      { title: 'Atomic Habits', author: 'James Clear', description: 'Tiny changes, remarkable results.', category_id: 5, total_copies: 3, available: 3 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', description: 'A gripping tragedy exploring prejudice and justice in the American South.', category_id: 1, total_copies: 4, available: 4 },
      { title: 'Cosmos', author: 'Carl Sagan', description: 'A fascinating journey through science, history, and philosophy.', category_id: 2, total_copies: 3, available: 3 },
      { title: 'The Silk Roads', author: 'Peter Frankopan', description: 'A major reassessment of world history, focusing on the regions of Central Asia.', category_id: 3, total_copies: 2, available: 2 },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', description: 'A comprehensive and standard guide to computer algorithms.', category_id: 4, total_copies: 3, available: 3 },
      { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', description: 'A holistic, integrated, principle-centered approach for solving personal and professional problems.', category_id: 5, total_copies: 4, available: 4 },
      { title: 'Steve Jobs', author: 'Walter Isaacson', description: 'The exclusive biography of Apple co-founder Steve Jobs, based on hundreds of interviews.', category_id: 6, total_copies: 3, available: 3 },
    ];
    const insertBook = db.prepare(`
      INSERT INTO books (title, author, description, category_id, total_copies, available)
      VALUES (@title, @author, @description, @category_id, @total_copies, @available)
    `);
    books.forEach(book => insertBook.run(book));

    console.log('✅ Database seeded with sample data');
  }

  console.log('✅ Database initialized at:', DB_PATH);
  return db;
}

module.exports = { getDb, initializeDatabase };
