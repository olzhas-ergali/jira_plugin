const express = require('express');
const historicalController = require('../controllers/historicalController');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const router = express.Router();

const historicalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 5, // Максимум 5 запросов парсинга в окне
  message: {
    success: false,
    error: 'Слишком много запросов парсинга исторических данных',
    message: 'Попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/parse', historicalLimiter, historicalController.parseHistoricalTasks.bind(historicalController));
router.post('/analyze-patterns', historicalLimiter, historicalController.analyzePatterns.bind(historicalController));
router.post('/create-from-history', historicalController.createTaskFromHistory.bind(historicalController));
router.get('/stats/:projectKey', historicalController.getHistoricalStats.bind(historicalController));

module.exports = router;
