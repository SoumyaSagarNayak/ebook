import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookById, borrowBook, getBookReviews, addReview, deleteReview } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMOJIS = ['📘','📗','📙','📕','📓','📔','📒','📃'];

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [message, setMessage]     = useState('');
  const [error, setError]         = useState('');

  // Reviews state
  const [reviews, setReviews]         = useState([]);
  const [avgRating, setAvgRating]     = useState(null);
  const [userRating, setUserRating]   = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [reviewMsg, setReviewMsg]     = useState('');

  useEffect(() => {
    getBookById(id)
      .then(res => setBook(res.data.book))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await getBookReviews(id);
      setReviews(res.data.reviews);
      setAvgRating(res.data.average_rating);
      // Pre-fill if user already reviewed
      if (user) {
        const mine = res.data.reviews.find(r => r.user_id === user.id);
        if (mine) { setUserRating(mine.rating); setReviewText(mine.review_text); }
      }
    } catch(err) { console.error(err); }
  };

  const handleBorrow = async () => {
    if (!user) { navigate('/login'); return; }
    setBorrowing(true); setError(''); setMessage('');
    try {
      const res = await borrowBook(book.id);
      setMessage(`Borrowed! Due: ${res.data.due_date}`);
      const updated = await getBookById(id);
      setBook(updated.data.book);
    } catch(err) { setError(err.response?.data?.error || 'Could not borrow.'); }
    finally { setBorrowing(false); }
  };

  const handleReadBookAdmin = () => {
    alert(`Opening "${book.title}" in reader mode. As an administrator, you have direct reading access to any book without needing to borrow it.`);
  };

  const handleReviewSubmit = async () => {
    if (!userRating) { setReviewMsg('Please select a star rating.'); return; }
    setSubmitting(true); setReviewMsg('');
    try {
      await addReview({ book_id: id, rating: userRating, review_text: reviewText });
      setReviewMsg('Review submitted!');
      fetchReviews();
    } catch(err) {
      setReviewMsg(err.response?.data?.error || 'Could not submit review.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      fetchReviews();
    } catch(err) { console.error(err); }
  };

  const renderStars = (rating, interactive = false) => {
    return [1,2,3,4,5].map(star => (
      <span
        key={star}
        style={{
          fontSize: interactive ? 28 : 16,
          cursor: interactive ? 'pointer' : 'default',
          color: star <= (interactive ? (hoverRating || userRating) : rating)
            ? '#f5c518' : '#444',
          transition: 'color 0.15s'
        }}
        onClick={() => interactive && setUserRating(star)}
        onMouseEnter={() => interactive && setHoverRating(star)}
        onMouseLeave={() => interactive && setHoverRating(0)}
      >★</span>
    ));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!book)   return null;

  return (
    <div className="container">
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 24 }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="book-detail">
        <div className="book-detail-cover">
          {book.file_path
            ? <img src={`http://localhost:5000/${book.file_path}`} alt={book.title}
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', borderRadius: 8 }} />
            : EMOJIS[book.id % EMOJIS.length]
          }
        </div>

        <div className="book-detail-info">
          <h1>{book.title}</h1>
          <div className="author">by {book.author}</div>

          {/* Average rating display */}
          {avgRating && (
            <div style={{ display:'flex', alignItems:'center', gap: 8, margin: '8px 0' }}>
              <span style={{ fontSize: 20 }}>{renderStars(Math.round(avgRating))}</span>
              <span style={{ color:'var(--accent)', fontWeight:600 }}>{avgRating}</span>
              <span style={{ color:'var(--muted)', fontSize:13 }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}

          <div className="book-detail-meta">
            <span className={`badge ${book.available > 0 ? 'badge-success' : 'badge-danger'}`}>
              {book.available > 0 ? `${book.available} available` : 'Not available'}
            </span>
            {book.category_name && <span className="badge badge-info">{book.category_name}</span>}
          </div>

          <p className="book-detail-desc">{book.description || 'No description available.'}</p>

          {message && <div className="alert alert-success">{message}</div>}
          {error   && <div className="alert alert-error">{error}</div>}

          {user ? (
            user.role === 'admin' ? (
              <button className="btn btn-primary" onClick={handleReadBookAdmin}>
                📖 Read Book (Admin Direct Access)
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleBorrow}
                disabled={borrowing || book.available <= 0}>
                {borrowing ? 'Borrowing...' : book.available > 0 ? '📖 Borrow this book' : 'Not Available'}
              </button>
            )
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Sign in to borrow
            </button>
          )}
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div className="reviews-section">
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>Reviews</h2>

        {/* Write a review */}
        {user && (
          <div className="review-form">
            <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--accent)' }}>
              {reviews.find(r => r.user_id === user.id) ? 'Update your review' : 'Write a review'}
            </h3>
            <div style={{ marginBottom: 12 }}>
              {renderStars(userRating, true)}
              {userRating > 0 && (
                <span style={{ marginLeft: 8, color:'var(--muted)', fontSize:13 }}>
                  {['','Poor','Fair','Good','Great','Excellent'][userRating]}
                </span>
              )}
            </div>
            <textarea
              className="review-textarea"
              placeholder="Share your thoughts about this book... (optional)"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
            />
            {reviewMsg && (
              <div className={`alert ${reviewMsg.includes('submitted') ? 'alert-success' : 'alert-error'}`}
                style={{ marginBottom: 8 }}>
                {reviewMsg}
              </div>
            )}
            <button className="btn btn-primary btn-sm" onClick={handleReviewSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div style={{ color:'var(--muted)', padding:'20px 0', fontSize:14 }}>
            No reviews yet. Be the first to review!
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="review-avatar">{r.user_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{r.user_name}</div>
                      <div style={{ color:'var(--muted)', fontSize:12 }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span>{renderStars(r.rating)}</span>
                    {(user?.id === r.user_id || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        style={{ background:'none', border:'none', color:'var(--danger)',
                          cursor:'pointer', fontSize:12, padding:'2px 6px' }}
                      >✕</button>
                    )}
                  </div>
                </div>
                {r.review_text && (
                  <p style={{ color:'var(--text)', fontSize:14, lineHeight:1.6, marginTop:8 }}>
                    {r.review_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}