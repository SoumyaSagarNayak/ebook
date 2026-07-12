import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isActive  = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor:'pointer' }}>
        📚 BookVault
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <button className={isActive('/')}          onClick={() => navigate('/')}>Library</button>
            <button className={isActive('/my-books')}  onClick={() => navigate('/my-books')}>
              {isAdmin ? 'Borrowed' : 'My Books'}
            </button>
            {isAdmin && (
              <button className={isActive('/admin')} onClick={() => navigate('/admin')}>
                Admin <span className="nav-badge">A</span>
              </button>
            )}
            <button
              className={isActive('/profile')}
              onClick={() => navigate('/profile')}
              style={{ display:'flex', alignItems:'center', gap:6 }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--accent)', color: '#000',
                display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700
              }}>
                {user.name?.split(' ')[0]?.[0]?.toUpperCase()}
              </span>
              {user.name?.split(' ')[0]}
            </button>
            <button className="nav-link logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button className={isActive('/login')}    onClick={() => navigate('/login')}>Login</button>
            <button className={isActive('/register')} onClick={() => navigate('/register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
}