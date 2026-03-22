const router = require('express').Router();
const reservations = require('../controllers/reservations.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

router.get('/', verifyToken, reservations.getAll);
router.post('/', verifyToken, reservations.create);
router.put('/:id', verifyToken, adminOnly, reservations.update);

module.exports = router;
