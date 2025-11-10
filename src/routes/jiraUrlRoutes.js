const express = require('express');
const jiraUrlController = require('../controllers/jiraUrlController');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const router = express.Router();

// Настройка rate limiting для URL операций
const urlAnalysisLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20, // Максимум 20 запросов анализа URL в окне
  message: {
    success: false,
    error: 'Слишком много запросов анализа URL',
    message: 'Попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const taskCreationLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 10, // Максимум 10 запросов создания задач в окне
  message: {
    success: false,
    error: 'Слишком много запросов создания задач',
    message: 'Попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Роуты для работы с Jira URL
router.post('/analyze-url', urlAnalysisLimiter, jiraUrlController.analyzeUrl.bind(jiraUrlController));
router.post('/create-from-url', taskCreationLimiter, jiraUrlController.createTaskFromUrl.bind(jiraUrlController));
router.post('/clone-task', taskCreationLimiter, jiraUrlController.cloneTask.bind(jiraUrlController));

// Роуты для получения информации
router.get('/issue/:issueKey', jiraUrlController.getIssueInfo.bind(jiraUrlController));
router.get('/project/:projectKey', jiraUrlController.getProjectInfo.bind(jiraUrlController));

module.exports = router;
