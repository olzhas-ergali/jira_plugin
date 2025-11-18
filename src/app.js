const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const taskRoutes = require('./routes/taskRoutes');
const jiraUrlRoutes = require('./routes/jiraUrlRoutes');
const projectAnalyzerRoutes = require('./routes/projectAnalyzerRoutes');
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
      'POST /api/create-task': 'Create task in Jira',
      'GET /api/categories': 'Get available categories',
      'GET /api/health': 'Check service status',
      'GET /api/project-info': 'Get Jira project info',
      'POST /api/jira/analyze-url': 'Analyze Jira URL',
      'POST /api/jira/create-from-url': 'Create task from URL',
      'POST /api/jira/clone-task': 'Clone task',
      'GET /api/jira/issue/:issueKey': 'Get issue info',
      'GET /api/jira/project/:projectKey': 'Get project info',
      'POST /api/project/full-analysis': 'Full project analysis'
    },
    documentation: 'https://github.com/your-repo/jira-openai-automation'
  });
});

app.use('/api', taskRoutes);
app.use('/api/jira', jiraUrlRoutes);
app.use('/api/project', projectAnalyzerRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
});

app.use(errorHandler);

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log('Jira OpenAI Automation Service started!');
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Project analysis: http://localhost:${PORT}/api/project/full-analysis`);
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
