import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar     from './components/Navbar';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Home       from './pages/Home';
import BookDetail from './pages/BookDetail';
import MyBooks    from './pages/MyBooks';
import Admin      from './pages/Admin';
import Profile from './pages/Profile';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user)    return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/login"     element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register"  element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/my-books"  element={<PrivateRoute><MyBooks /></PrivateRoute>} />
        <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}