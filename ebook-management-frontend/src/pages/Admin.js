import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBooks, addBook, deleteBook, updateBook, getCategories, getAllBorrows, addCategory } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]               = useState('books');
  const [books, setBooks]           = useState([]);
  const [borrows, setBorrows]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBook, setEditBook]     = useState(null);
  const [message, setMessage]       = useState('');
  const [newBook, setNewBook]       = useState({ title:'', author:'', description:'', category_id:'', total_copies:1, file:null });
  const [newCat, setNewCat]         = useState('');

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, c, br] = await Promise.all([getAllBooks(), getCategories(), getAllBorrows()]);
      setBooks(b.data.books);
      setCategories(c.data.categories);
      setBorrows(br.data.records);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newBook.title);
      formData.append('author', newBook.author);
      formData.append('description', newBook.description);
      formData.append('category_id', newBook.category_id);
      formData.append('total_copies', newBook.total_copies);
      if (newBook.file) formData.append('file', newBook.file);
      await addBook(formData);
      setMessage('Book added successfully!');
      setShowModal(false);
      setNewBook({ title:'', author:'', description:'', category_id:'', total_copies:1, file:null });
      loadData();
    } catch(err) { setMessage(err.response?.data?.error || 'Failed to add book.'); }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', editBook.title);
      formData.append('author', editBook.author);
      formData.append('description', editBook.description || '');
      formData.append('category_id', editBook.category_id || '');
      formData.append('total_copies', editBook.total_copies);
      if (editBook.file) formData.append('file', editBook.file);
      await updateBook(editBook.id, formData);
      setMessage('Book updated successfully!');
      setShowEditModal(false);
      setEditBook(null);
      loadData();
    } catch(err) { setMessage(err.response?.data?.error || 'Failed to update book.'); }
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteBook(id);
      setMessage('Book deleted.');
      loadData();
    } catch(err) { setMessage(err.response?.data?.error || 'Cannot delete.'); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await addCategory(newCat);
      setNewCat('');
      setMessage('Category added!');
      loadData();
    } catch(err) { setMessage(err.response?.data?.error || 'Failed.'); }
  };

  const activeBorrows   = borrows.filter(b => b.status === 'borrowed').length;
  const returnedBorrows = borrows.filter(b => b.status === 'returned').length;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage books, categories and borrow records</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('success')||message.includes('added')||message.includes('deleted')||message.includes('Category') ? 'alert-success' : 'alert-danger'}`}
          style={{marginBottom:20}}>
          {message}
          <button onClick={() => setMessage('')} style={{float:'right',background:'none',border:'none',cursor:'pointer',color:'inherit'}}>×</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-num">{books.length}</div><div className="stat-label">Total Books</div></div>
        <div className="stat-card"><div className="stat-num">{categories.length}</div><div className="stat-label">Categories</div></div>
        <div className="stat-card"><div className="stat-num">{activeBorrows}</div><div className="stat-label">Active Borrows</div></div>
        <div className="stat-card"><div className="stat-num">{returnedBorrows}</div><div className="stat-label">Returned</div></div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid var(--border)',paddingBottom:12}}>
        {['books','borrows','categories'].map(t => (
          <button key={t} className={`btn ${tab===t?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <>
          {tab === 'books' && (
            <>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Book</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Cover</th><th>Title</th><th>Author</th><th>Category</th><th>Copies</th><th>Available</th><th>Action</th></tr></thead>
                  <tbody>
                    {books.map(b => (
                      <tr key={b.id}>
                        <td>
                          {b.file_path
                            ? <img src={`http://localhost:5000/${b.file_path}`} alt="cover"
                                style={{width:40,height:55,objectFit:'cover',borderRadius:4}}/>
                            : <div style={{width:40,height:55,background:'var(--bg3)',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📖</div>
                          }
                        </td>
                        <td><strong>{b.title}</strong></td>
                        <td style={{color:'var(--muted)'}}>{b.author}</td>
                        <td><span className="badge badge-info">{b.category_name||'-'}</span></td>
                        <td>{b.total_copies}</td>
                        <td><span className={`badge ${b.available>0?'badge-success':'badge-danger'}`}>{b.available}</span></td>
                        <td style={{display:'flex',gap:6}}>
                          <button className="btn btn-sm" 
                            style={{background:'var(--accent)',color:'#000'}}
                            onClick={() => { setEditBook({...b, file:null}); setShowEditModal(true); }}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBook(b.id, b.title)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'borrows' && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Book</th><th>Borrowed</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {borrows.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.user_name}</strong><br/><span style={{fontSize:12,color:'var(--muted)'}}>{r.user_email}</span></td>
                      <td>{r.book_title}</td>
                      <td style={{color:'var(--muted)'}}>{new Date(r.borrowed_at).toLocaleDateString()}</td>
                      <td>{new Date(r.due_date).toLocaleDateString()}</td>
                      <td><span className={`badge ${r.status==='borrowed'?'badge-info':'badge-success'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'categories' && (
            <>
              <form onSubmit={handleAddCategory} style={{display:'flex',gap:10,marginBottom:20}}>
                <input placeholder="New category name..." value={newCat} onChange={e => setNewCat(e.target.value)}
                  style={{flex:1,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text)',padding:'8px 12px',borderRadius:6}}/>
                <button type="submit" className="btn btn-primary">Add</button>
              </form>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Category</th><th>Books</th></tr></thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td><span className="badge badge-gold">{c.book_count} books</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ADD BOOK MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add New Book</h2>
            <form onSubmit={handleAddBook}>
              <div className="form-group"><label>Title *</label>
                <input required value={newBook.title} onChange={e => setNewBook({...newBook,title:e.target.value})}/>
              </div>
              <div className="form-group"><label>Author *</label>
                <input required value={newBook.author} onChange={e => setNewBook({...newBook,author:e.target.value})}/>
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows={3} value={newBook.description} onChange={e => setNewBook({...newBook,description:e.target.value})}/>
              </div>
              <div className="form-group"><label>Category</label>
                <select value={newBook.category_id} onChange={e => setNewBook({...newBook,category_id:e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Total Copies</label>
                <input type="number" min={1} value={newBook.total_copies} onChange={e => setNewBook({...newBook,total_copies:e.target.value})}/>
              </div>
              <div className="form-group"><label>Book Cover Image</label>
                <input type="file" accept="image/*"
                  onChange={e => setNewBook({...newBook, file: e.target.files[0]})}
                  style={{color:'var(--text)',background:'var(--bg3)',border:'1px solid var(--border)',padding:'8px',borderRadius:'6px',width:'100%'}}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BOOK MODAL */}
      {showEditModal && editBook && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Book</h2>
            {editBook.file_path && (
              <div style={{marginBottom:12,textAlign:'center'}}>
                <img src={`http://localhost:5000/${editBook.file_path}`} alt="current cover"
                  style={{width:80,height:110,objectFit:'cover',borderRadius:6,border:'2px solid var(--border)'}}/>
                <p style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Current cover</p>
              </div>
            )}
            <form onSubmit={handleEditBook}>
              <div className="form-group"><label>Title *</label>
                <input required value={editBook.title} onChange={e => setEditBook({...editBook,title:e.target.value})}/>
              </div>
              <div className="form-group"><label>Author *</label>
                <input required value={editBook.author} onChange={e => setEditBook({...editBook,author:e.target.value})}/>
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows={3} value={editBook.description||''} onChange={e => setEditBook({...editBook,description:e.target.value})}/>
              </div>
              <div className="form-group"><label>Category</label>
                <select value={editBook.category_id||''} onChange={e => setEditBook({...editBook,category_id:e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Total Copies</label>
                <input type="number" min={1} value={editBook.total_copies} onChange={e => setEditBook({...editBook,total_copies:e.target.value})}/>
              </div>
              <div className="form-group"><label>New Cover Image (optional)</label>
                <input type="file" accept="image/*"
                  onChange={e => setEditBook({...editBook, file: e.target.files[0]})}
                  style={{color:'var(--text)',background:'var(--bg3)',border:'1px solid var(--border)',padding:'8px',borderRadius:'6px',width:'100%'}}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}