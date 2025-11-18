const express = require('express');
const taskController = require('../controllers/taskController');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const router = express.Router();

const createTaskLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 10, // Максимум 10 запросов на создание задач в окне
  message: {
    success: false,
    error: 'Слишком много запросов на создание задач',
    message: 'Попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/create-task', createTaskLimiter, taskController.createTask.bind(taskController));
router.get('/categories', taskController.getCategories.bind(taskController));
router.get('/health', taskController.healthCheck.bind(taskController));
router.get('/project-info', taskController.getProjectInfo.bind(taskController));

module.exports = router;
