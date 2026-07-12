import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getProfile()
      .then(res => {
        setProfile(res.data.user);
        setStats(res.data.stats);
        setName(res.data.user.name);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      await updateProfile({ name });
      setProfile(prev => ({ ...prev, name }));
      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch(err) {
      setError(err.response?.data?.error || 'Could not update profile.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return null;

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account details</p>
      </div>

      <div className="profile-layout">

        {/* ── Left: Profile Card ── */}
        <div className="profile-card">
          <div className="profile-avatar-lg">
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-email">{profile.email}</p>
          <span className={`badge ${profile.role === 'admin' ? 'badge-gold' : 'badge-info'}`}
            style={{ marginTop: 8 }}>
            {profile.role === 'admin' ? '👑 Admin' : '📖 Member'}
          </span>
          <p className="profile-joined">Member since {joinDate}</p>
        </div>

        {/* ── Right: Details + Stats ── */}
        <div className="profile-right">

          {/* Edit Profile */}
          <div className="profile-section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:16, color:'var(--accent)' }}>Account Details</h3>
              {!editing && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                  ✏️ Edit
                </button>
              )}
            </div>

            {message && <div className="alert alert-success" style={{ marginBottom:12 }}>{message}</div>}
            {error   && <div className="alert alert-error"   style={{ marginBottom:12 }}>{error}</div>}

            <div className="profile-field">
              <label>Full Name</label>
              {editing ? (
                <input
                  className="profile-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              ) : (
                <span>{profile.name}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Email</label>
              <span style={{ color:'var(--muted)' }}>{profile.email}</span>
            </div>

            <div className="profile-field">
              <label>Role</label>
              <span style={{ textTransform:'capitalize' }}>{profile.role}</span>
            </div>

            {editing && (
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setName(profile.name); }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Borrow Stats */}
          {stats && profile.role !== 'admin' && (
            <div className="profile-section">
              <h3 style={{ fontSize:16, color:'var(--accent)', marginBottom:16 }}>Borrow Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.total_borrowed || 0}</div>
                  <div className="stat-label">Total Borrowed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.currently_borrowed || 0}</div>
                  <div className="stat-label">Currently Borrowed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.total_returned || 0}</div>
                  <div className="stat-label">Returned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number" style={{ color: stats.total_fines > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{stats.total_fines || 0}
                  </div>
                  <div className="stat-label">Total Fines</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}