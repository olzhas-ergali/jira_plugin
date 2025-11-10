const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const taskRoutes = require('./routes/taskRoutes');
const jiraUrlRoutes = require('./routes/jiraUrlRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

app.use(helmet());
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); 

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Jira OpenAI Automation Service',
    version: '1.1.0',
    endpoints: {
      'POST /api/create-task': 'Создать задачу в Jira',
      'GET /api/categories': 'Получить доступные категории',
      'GET /api/health': 'Проверить статус сервисов',
      'GET /api/project-info': 'Получить информацию о проекте Jira',
      'POST /api/jira/analyze-url': 'Анализ Jira URL',
      'POST /api/jira/create-from-url': 'Создать задачу из Jira URL',
      'POST /api/jira/clone-task': 'Клонировать задачу',
      'GET /api/jira/issue/:issueKey': 'Получить информацию о задаче',
      'GET /api/jira/project/:projectKey': 'Получить информацию о проекте'
    },
    documentation: 'https://github.com/your-repo/jira-openai-automation'
  });
});

app.use('/api', taskRoutes);
app.use('/api/jira', jiraUrlRoutes);

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
  console.log('Jira OpenAI Automation Service запущен!');
  console.log(`Сервер доступен на http://localhost:${PORT}`);
  console.log(`API документация: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
