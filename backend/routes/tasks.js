const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listTasks, getTask, createTask, updateTask, deleteTask, getTaskCounts,
} = require('../controllers/taskController');

router.use(authenticate);

router.get('/',       listTasks);
router.get('/counts', getTaskCounts);
router.get('/:id',    getTask);
router.post('/',      createTask);
router.patch('/:id',  updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
