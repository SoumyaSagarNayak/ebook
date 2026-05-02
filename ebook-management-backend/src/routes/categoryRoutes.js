const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { getAllCategories, addCategory, deleteCategory } = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.post('/', verifyToken, verifyAdmin, addCategory);
router.delete('/:id', verifyToken, verifyAdmin, deleteCategory);

module.exports = router;