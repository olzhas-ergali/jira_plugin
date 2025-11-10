const express = require('express');
const simpleController = require('../controllers/simpleController');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const router = express.Router();

// Настройка rate limiting
const generateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20, // Максимум 20 запросов генерации в окне
  message: {
    success: false,
    error: 'Слишком много запросов генерации',
    message: 'Попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Роуты для простой генерации
router.post('/generate', generateLimiter, simpleController.generateTask.bind(simpleController));
router.post('/generate-from-url', generateLimiter, simpleController.generateFromUrl.bind(simpleController));
router.post('/generate-variants', generateLimiter, simpleController.generateVariants.bind(simpleController));
router.get('/categories', simpleController.getCategories.bind(simpleController));
router.get('/health', simpleController.healthCheck.bind(simpleController));

module.exports = router;

