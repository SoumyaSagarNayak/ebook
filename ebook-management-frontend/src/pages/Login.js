import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch(err) { setError(err.response?.data?.error || 'Login failed.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Welcome back</h1>
        <p>Sign in to your BookVault account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Email</label>
            <input type="email" placeholder="admin@ebook.com" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div className="form-group"><label>Password</label>
            <input type="password" placeholder="••••••••" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
          <button className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{marginTop:20,textAlign:'center',fontSize:14,color:'var(--muted)'}}>
          No account? <Link to="/register">Register</Link>
        </p>
        <div style={{marginTop:20,padding:12,background:'var(--bg3)',borderRadius:8}}>
          <p style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>Demo accounts:</p>
          <button className="btn btn-ghost btn-sm" style={{marginRight:8}} onClick={() => setForm({email:'admin@ebook.com',password:'admin123'})}>Admin</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setForm({email:'john@example.com',password:'user123'})}>User</button>
        </div>
      </div>
    </div>
  );
}