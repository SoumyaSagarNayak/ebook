import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBooks, getCategories } from '../services/api';

export default function Home() {
  const [books, setBooks]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [search, setSearch]           = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [loading, setLoading]         = useState(true);
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.search      = search;
      if (categoryId) params.category_id = categoryId;
      const res = await getAllBooks(params);
      setBooks(res.data.books);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { getCategories().then(res => setCategories(res.data.categories)); }, []);
  useEffect(() => { const t = setTimeout(fetchBooks, 300); return () => clearTimeout(t); }, [search, categoryId]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Book Library</h1>
        <p>Browse and borrow from our collection</p>
      </div>

      <div className="search-bar">
        <input
          placeholder="Search by title or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.book_count})</option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategoryId(''); }}>Clear</button>
      </div>

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No books found</h3>
        </div>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <div
              key={book.id}
              className="book-card"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <div className="book-cover">
                {book.file_path ? (
                  <img
                    src={`http://localhost:5000/${book.file_path}`}
                    alt={book.title}
                  />
                ) : (
                  <span className="book-cover-placeholder">📖</span>
                )}
              </div>
              <div className="card-body">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
                <div className="book-meta">
                  <span className={`badge ${book.available > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {book.available > 0 ? `${book.available} available` : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}