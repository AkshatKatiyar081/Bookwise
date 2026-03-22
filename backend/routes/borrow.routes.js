const router = require('express').Router();
const borrow = require('../controllers/borrow.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

router.get('/', verifyToken, borrow.getAll);
router.post('/', verifyToken, adminOnly, borrow.issueBook);
router.put('/:id/return', verifyToken, adminOnly, borrow.returnBook);

module.exports = router;
