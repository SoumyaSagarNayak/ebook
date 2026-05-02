const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { borrowBook, returnBook, getMyHistory, getAllBorrows } = require('../controllers/borrowController');

router.post('/', verifyToken, borrowBook);
router.put('/:id/return', verifyToken, returnBook);
router.get('/my-history', verifyToken, getMyHistory);
router.get('/all', verifyToken, verifyAdmin, getAllBorrows);

module.exports = router;