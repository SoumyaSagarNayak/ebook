# 📚 E-Book Management — Backend API Reference

Use this file to test every API endpoint with Thunder Client (VS Code extension) or Postman.

---

## Base URL
```
http://localhost:5000
```

---

## 🔐 AUTH ENDPOINTS

### Register a new user
```
POST /api/auth/register
Body (JSON):
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "alice123"
}
```

### Login
```
POST /api/auth/login
Body (JSON):
{
  "email": "admin@ebook.com",
  "password": "admin123"
}
→ Returns: { token: "eyJhbG..." }
  COPY this token — you'll need it for protected routes!
```

### Get my profile (login required)
```
GET /api/auth/me
Header: Authorization: Bearer <your_token>
```

---

## 📖 BOOK ENDPOINTS

### Get all books (public)
```
GET /api/books
```

### Search books
```
GET /api/books?search=gatsby
GET /api/books?category_id=1
GET /api/books?search=science&category_id=2
```

### Get single book
```
GET /api/books/1
```

### Add a book (ADMIN only)
```
POST /api/books
Header: Authorization: Bearer <admin_token>
Body (JSON):
{
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "description": "A magical story about following your dreams.",
  "category_id": 1,
  "total_copies": 3
}
```

### Update a book (ADMIN only)
```
PUT /api/books/1
Header: Authorization: Bearer <admin_token>
Body (JSON):
{
  "title": "The Great Gatsby (Updated)",
  "total_copies": 5
}
```

### Delete a book (ADMIN only)
```
DELETE /api/books/1
Header: Authorization: Bearer <admin_token>
```

---

## 📦 BORROW ENDPOINTS

### Borrow a book (login required)
```
POST /api/borrow
Header: Authorization: Bearer <your_token>
Body (JSON):
{
  "book_id": 1
}
```

### Return a book (login required)
```
PUT /api/borrow/1/return
Header: Authorization: Bearer <your_token>
```

### My borrow history (login required)
```
GET /api/borrow/my-history
Header: Authorization: Bearer <your_token>
```

### All borrows — ADMIN only
```
GET /api/borrow/all
Header: Authorization: Bearer <admin_token>
```

---

## 🏷️ CATEGORY ENDPOINTS

### Get all categories (public)
```
GET /api/categories
```

### Add category (ADMIN only)
```
POST /api/categories
Header: Authorization: Bearer <admin_token>
Body (JSON):
{
  "name": "Philosophy"
}
```

### Delete category (ADMIN only)
```
DELETE /api/categories/1
Header: Authorization: Bearer <admin_token>
```

---

## 👤 Default Seeded Accounts

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@ebook.com   | admin123  |
| User  | john@example.com  | user123   |
