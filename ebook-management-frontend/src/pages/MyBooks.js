import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyHistory, returnBook } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyBooks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [returning, setReturning] = useState(null);
  const [message, setMessage]     = useState('');

  const fetchHistory = async () => {
    try {
      const res = await getMyHistory();
      setRecords(res.data.records);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchHistory(); }, []);

  const handleReturn = async (recordId) => {
    setReturning(recordId);
    setMessage('');
    try {
      const res = await returnBook(recordId);
      const { fine_message } = res.data;
      setMessage(fine_message);
      fetchHistory();
    } catch(err) {
      setMessage(err.response?.data?.error || 'Could not return.');
    } finally {
      setReturning(null);
    }
  };

  // Check if a record is overdue
  const isOverdue = (due_date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(due_date) < today;
  };

  // Days overdue or days remaining
  const getDueDateInfo = (due_date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(due_date);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)} day(s) overdue`, overdue: true };
    if (diff === 0) return { label: 'Due today!', overdue: true };
    return { label: `${diff} day(s) left`, overdue: false };
  };

  const active   = records.filter(r => r.status === 'borrowed');
  const returned = records.filter(r => r.status === 'returned');

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Books</h1>
        <p>Your borrow history</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('fine') || message.includes('Fine') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--accent)' }}>
        Currently Borrowed ({active.length})
      </h2>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : active.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No active borrows</h3>
          <p><span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/')}>Browse the library</span></p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginBottom: 40 }}>
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {active.map(r => {
                const info = getDueDateInfo(r.due_date);
                return (
                  <tr key={r.id}>
                    <td><strong>{r.title}</strong></td>
                    <td style={{ color: 'var(--muted)' }}>{r.author}</td>
                    <td>{new Date(r.due_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${info.overdue ? 'badge-danger' : 'badge-success'}`}>
                        {info.label}
                      </span>
                      {info.overdue && (
                        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                          Fine: ₹{Math.abs(Math.round((new Date(r.due_date) - new Date()) / (1000*60*60*24))) * 5} est.
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleReturn(r.id)}
                        disabled={returning === r.id}
                      >
                        {returning === r.id ? 'Returning...' : '↩ Return'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {returned.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--muted)' }}>
            History ({returned.length})
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Returned</th>
                  <th>Fine Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {returned.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.title}</strong></td>
                    <td style={{ color: 'var(--muted)' }}>
                      {r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {r.fine_amount > 0
                        ? <span className="badge badge-danger">₹{r.fine_amount}</span>
                        : <span className="badge badge-success">No fine</span>
                      }
                    </td>
                    <td><span className="badge badge-success">Returned</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}