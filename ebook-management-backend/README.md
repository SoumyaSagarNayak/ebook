# 📚 E-Book Management — Backend

Built with: Node.js + Express + SQLite (better-sqlite3)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Create uploads folder
```bash
mkdir uploads
```

### 3. Start the server
```bash
npm run dev
```

Visit http://localhost:5000 — you should see the API running message!

## Project Structure

```
ebook-backend/
├── src/
│   ├── server.js              ← Entry point — start here
│   ├── db/
│   │   └── database.js        ← DB setup, tables, seed data
│   ├── middleware/
│   │   └── auth.js            ← JWT token verification
│   ├── controllers/
│   │   ├── authController.js  ← Register, login, profile
│   │   ├── bookController.js  ← Book CRUD operations
│   │   ├── borrowController.js← Borrow & return logic
│   │   └── categoryController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── bookRoutes.js
│       ├── borrowRoutes.js
│       └── categoryRoutes.js
├── uploads/                   ← Uploaded PDFs go here
├── ebook.db                   ← SQLite database (auto-created)
├── .env                       ← Environment variables
├── API_REFERENCE.md           ← All API endpoints to test
└── package.json
```

## Default Accounts (auto-created)

| Role  | Email            | Password |
|-------|------------------|----------|
| Admin | admin@ebook.com  | admin123 |
| User  | john@example.com | user123  |
