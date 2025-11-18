const openaiService = require('../services/openaiService');
const jiraService = require('../services/jiraService');
const templates = require('../config/templates.json');
const Joi = require('joi');

class TaskController {
  /**
   * Создает задачу в Jira с использованием OpenAI
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async createTask(req, res) {
    try {
      const schema = Joi.object({
        description: Joi.string().min(10).max(500).required(),
        category: Joi.string().valid(...Object.keys(templates.categories)).required(),
        assignee: Joi.string().email().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { description, category, assignee } = value;

      const categoryTemplate = templates.categories[category];
      if (!categoryTemplate) {
        return res.status(400).json({
          success: false,
          error: 'Неизвестная категория',
          availableCategories: Object.keys(templates.categories)
        });
      }

      console.log(`🤖 Генерация контента для задачи категории "${category}"...`);
      
      const generatedContent = await openaiService.generateTaskContent(
        description, 
        category, 
        categoryTemplate.template
      );

      console.log('✅ Контент сгенерирован успешно');

      const formattedContent = openaiService.formatContentByTemplate(
        generatedContent, 
        categoryTemplate.template
      );

      const taskData = {
        title: formattedContent.title,
        description: formattedContent.description,
        priority: formattedContent.priority,
        labels: [...formattedContent.labels, ...categoryTemplate.labels],
        assignee: assignee || templates.default_assignees[categoryTemplate.assignee_rule]
      };

      console.log(`📝 Создание задачи в Jira: ${taskData.title}`);

      const jiraResult = await jiraService.createIssue(taskData);

      console.log(`✅ Задача создана: ${jiraResult.issueKey}`);

      res.status(201).json({
        success: true,
        message: 'Задача успешно создана',
        data: {
          issueKey: jiraResult.issueKey,
          issueUrl: jiraResult.issueUrl,
          title: taskData.title,
          category: category,
          priority: taskData.priority,
          labels: taskData.labels,
          assignee: taskData.assignee
        }
      });

    } catch (error) {
      console.error('❌ Ошибка создания задачи:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Получает доступные категории задач
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async getCategories(req, res) {
    try {
      const categories = Object.keys(templates.categories).map(key => ({
        key,
        name: templates.categories[key].name,
        priority: templates.categories[key].priority,
        labels: templates.categories[key].labels
      }));

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Ошибка получения категорий:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения категорий',
        message: error.message
      });
    }
  }

  /**
   * Проверяет статус подключений к внешним сервисам
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async healthCheck(req, res) {
    try {
      const checks = {
        jira: false,
        openai: false
      };

      try {
        checks.jira = await jiraService.testConnection();
      } catch (error) {
        console.error('Jira connection check failed:', error.message);
      }

      try {
        checks.openai = !!process.env.OPENAI_API_KEY;
      } catch (error) {
        console.error('OpenAI connection check failed:', error.message);
      }

      const allHealthy = Object.values(checks).every(check => check === true);

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks
      });
    } catch (error) {
      console.error('Health check error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: error.message
      });
    }
  }

  /**
   * Получает информацию о проекте Jira
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async getProjectInfo(req, res) {
    try {
      const projectInfo = await jiraService.getProjectInfo();
      const issueTypes = await jiraService.getIssueTypes();

      res.json({
        success: true,
        data: {
          project: {
            key: projectInfo.key,
            name: projectInfo.name,
            description: projectInfo.description
          },
          issueTypes: issueTypes.map(type => ({
            id: type.id,
            name: type.name,
            description: type.description
          }))
        }
      });
    } catch (error) {
      console.error('Ошибка получения информации о проекте:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения информации о проекте',
        message: error.message
      });
    }
  }
}

module.exports = new TaskController();
