const { getDb } = require('../db/database');

function getAllCategories(req, res) {
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*, COUNT(b.id) AS book_count
    FROM categories c
    LEFT JOIN books b ON b.category_id = c.id
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json({ categories });
}

function addCategory(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });
  const db = getDb();
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'Category already exists.' });
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  res.status(201).json({ message: 'Category created!', id: result.lastInsertRowid });
}

function deleteCategory(req, res) {
  const db = getDb();
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Category deleted.' });
}

module.exports = { getAllCategories, addCategory, deleteCategory };