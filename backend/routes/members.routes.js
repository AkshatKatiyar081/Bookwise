const router = require('express').Router();
const members = require('../controllers/members.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');

router.get('/', verifyToken, adminOnly, members.getAll);
router.get('/:id', verifyToken, members.getById);
router.post('/', verifyToken, adminOnly, members.create);
router.put('/:id', verifyToken, adminOnly, members.update);
router.delete('/:id', verifyToken, adminOnly, members.remove);

module.exports = router;
