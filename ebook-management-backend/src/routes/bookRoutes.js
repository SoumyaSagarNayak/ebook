const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { getAllBooks, getBookById, addBook, updateBook, deleteBook } = require('../controllers/bookController');

router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', verifyToken, verifyAdmin, addBook);
router.put('/:id', verifyToken, verifyAdmin, updateBook);
router.delete('/:id', verifyToken, verifyAdmin, deleteBook);

module.exports = router;