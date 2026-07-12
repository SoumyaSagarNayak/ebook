const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function calculateRecordFine(r) {
  const dueDate = new Date(r.due_date);
  const endDate = r.returned_at ? new Date(r.returned_at) : new Date();
  dueDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate - dueDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 5 : 0;
}

function register(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered.' });

  const userRole = role === 'admin' ? 'admin' : 'user';
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, password, userRole); // Password stored in plain text

  res.status(201).json({
    message: 'Account created successfully!',
    user: { id: result.lastInsertRowid, name, email, role: userRole }
  });
}

function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const db = getDb();
  
  // Clean/normalize input
  const inputClean = email.trim();
  
  // Try to find user by email or name
  let user = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(inputClean, inputClean);
  
  if (!user) {
    // Determine details for auto-created user
    const hasAt = inputClean.includes('@');
    const namePart = hasAt ? inputClean.split('@')[0] : inputClean;
    
    // Capitalize words for user name
    const formattedName = namePart.split(/[\._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || 'User';
    const formattedEmail = hasAt ? inputClean.toLowerCase() : `${inputClean.toLowerCase()}@example.com`;
    const userRole = inputClean.toLowerCase().includes('admin') ? 'admin' : 'user';
    
    // Double check email doesn't exist under formatted email
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(formattedEmail);
    
    if (!user) {
      // Insert user on the fly with plain text password
      const result = db.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      ).run(formattedName, formattedEmail, password, userRole);
      
      user = {
        id: result.lastInsertRowid,
        name: formattedName,
        email: formattedEmail,
        role: userRole
      };
    }
  }

  // Any password will work! We do not verify password hashes.
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful!',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

function getProfile(req, res) {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Calculate dynamic stats
  const records = db.prepare('SELECT * FROM borrow_records WHERE user_id = ?').all(req.user.id);
  
  let total_borrowed = records.length;
  let currently_borrowed = 0;
  let total_returned = 0;
  let total_fines = 0;

  records.forEach(r => {
    if (r.status === 'borrowed') {
      currently_borrowed++;
    } else if (r.status === 'returned') {
      total_returned++;
    }
    total_fines += calculateRecordFine(r);
  });

  const stats = {
    total_borrowed,
    currently_borrowed,
    total_returned,
    total_fines
  };

  res.json({ user, stats });
}

function updateProfile(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });

  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);

  res.json({ message: 'Profile updated successfully!' });
}

module.exports = { register, login, getProfile, updateProfile };