const router = require('express').Router();
const fines = require('../controllers/fines.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

router.get('/', verifyToken, fines.getAll);
router.put('/:id/pay', verifyToken, adminOnly, fines.payFine);

module.exports = router;
