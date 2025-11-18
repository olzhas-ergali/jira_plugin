const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const simpleRoutes = require('./routes/simpleRoutes');
const historicalRoutes = require('./routes/historicalRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

app.use(helmet()); // Безопасность
app.use(cors()); // CORS
app.use(express.json({ limit: '10mb' })); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded
app.use(express.static('public'));
app.use(requestLogger); 

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Jira OpenAI Automation - Simple Mode',
    version: '1.1.0',
    description: 'Простой режим без интеграции с Jira API',
    endpoints: {
      'POST /api/simple/generate': 'Генерировать задачу',
      'POST /api/simple/generate-from-url': 'Генерировать задачу из Jira URL',
      'POST /api/simple/generate-variants': 'Генерировать несколько вариантов',
      'GET /api/simple/categories': 'Получить доступные категории',
      'GET /api/simple/health': 'Проверить статус сервиса',
      'POST /api/historical/parse': 'Парсить исторические задачи',
      'POST /api/historical/analyze-patterns': 'Анализировать паттерны',
      'POST /api/historical/create-from-history': 'Создать задачу на основе истории',
      'GET /api/historical/stats/:projectKey': 'Получить статистику проекта'
    },
    usage: {
      step1: '1. Отправьте POST запрос с описанием задачи',
      step2: '2. Получите сгенерированный контент',
      step3: '3. Скопируйте результат в Jira вручную',
      note: 'Никаких Jira API токенов не требуется!'
    },
    documentation: 'https://github.com/your-repo/jira-openai-automation'
  });
});

app.use('/api/simple', simpleRoutes);
app.use('/api/historical', historicalRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint не найден',
    message: `Маршрут ${req.method} ${req.originalUrl} не существует`
  });
});

app.use(errorHandler);

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log('🚀 Jira OpenAI Automation - Simple Mode запущен!');
  console.log(`📡 Сервер доступен на http://localhost:${PORT}`);
  console.log(`📚 API документация: http://localhost:${PORT}/api/simple`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/simple/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Простой режим - без Jira API токенов!');
  console.log('📋 Генерируйте контент и копируйте в Jira вручную');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;

