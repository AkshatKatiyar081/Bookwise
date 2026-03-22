const router = require('express').Router();
const books = require('../controllers/books.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

router.get('/', books.getAll);
router.get('/:id', books.getById);
router.post('/', verifyToken, adminOnly, books.create);
router.put('/:id', verifyToken, adminOnly, books.update);
router.delete('/:id', verifyToken, adminOnly, books.remove);

module.exports = router;
