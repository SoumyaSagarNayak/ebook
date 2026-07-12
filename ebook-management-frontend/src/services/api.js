import axios from 'axios';
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'https://book-vault-e9tl.onrender.com/api' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginUser      = (data)     => API.post('/auth/login', data);
export const registerUser   = (data)     => API.post('/auth/register', data);
export const getAllBooks     = (params)   => API.get('/books', { params });
export const getBookById    = (id)       => API.get(`/books/${id}`);
export const addBook        = (data)     => API.post('/books', data);
export const deleteBook     = (id)       => API.delete(`/books/${id}`);
export const updateBook     = (id, data) => API.put(`/books/${id}`, data);
export const borrowBook     = (book_id)  => API.post('/borrow', { book_id });
export const returnBook     = (id)       => API.put(`/borrow/${id}/return`);
export const getMyHistory   = ()         => API.get('/borrow/my-history');
export const getAllBorrows   = ()         => API.get('/borrow/all');
export const getCategories  = ()         => API.get('/categories');
export const addCategory    = (name)     => API.post('/categories', { name });
export const deleteCategory = (id)       => API.delete(`/categories/${id}`);
export const getBookReviews = (book_id) => API.get(`/reviews/${book_id}`);
export const addReview       = (data)    => API.post('/reviews', data);
export const deleteReview    = (id)      => API.delete(`/reviews/${id}`);
export const getProfile    = ()     => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);
export default API;