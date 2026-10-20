const router = require('express').Router();
const books = require('../controllers/books.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

router.get('/', verifyToken, books.getAll);
router.get('/:id', verifyToken, books.getById);
router.post('/', verifyToken, adminOnly, books.create);
router.put('/:id', verifyToken, adminOnly, books.update);
router.delete('/:id', verifyToken, adminOnly, books.remove);

module.exports = router;
