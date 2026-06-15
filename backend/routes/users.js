const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listUsers, listActiveUsers, getUser, createUser, updateUser, deleteUser,
} = require('../controllers/userController');

router.use(authenticate);

router.get('/',        listUsers);
router.get('/active',  listActiveUsers);
router.get('/:id',     getUser);
router.post('/',       createUser);
router.patch('/:id',   updateUser);
router.delete('/:id',  deleteUser);

module.exports = router;
