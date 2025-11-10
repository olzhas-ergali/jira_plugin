const simpleOpenAIService = require('../services/simpleOpenAIService');
const Joi = require('joi');

class SimpleController {
  /**
   * Генерирует задачу с помощью OpenAI
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async generateTask(req, res) {
    try {
      const schema = Joi.object({
        description: Joi.string().min(10).max(500).required(),
        category: Joi.string().valid('DevOps', 'Аналитика', 'Backend', 'Frontend', 'Инфраструктура').required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { description, category } = value;

      console.log(`🤖 Генерация задачи категории "${category}"...`);
      
      const generatedContent = await simpleOpenAIService.generateTaskContent(description, category);

      console.log('✅ Задача сгенерирована успешно');

      res.json({
        success: true,
        message: 'Задача успешно сгенерирована',
        data: {
          title: generatedContent.title,
          description: generatedContent.description,
          priority: generatedContent.priority,
          labels: generatedContent.labels,
          assignee_suggestion: generatedContent.assignee_suggestion,
          acceptance_criteria: generatedContent.acceptance_criteria,
          category: category,
          technical_notes: generatedContent.technical_notes,
          ui_notes: generatedContent.ui_notes,
          infrastructure_notes: generatedContent.infrastructure_notes,
          analytics_notes: generatedContent.analytics_notes,
          copy_instructions: {
            title: 'Скопируйте это название в поле "Summary" в Jira',
            description: 'Скопируйте это описание в поле "Description" в Jira',
            labels: 'Добавьте эти метки в поле "Labels" в Jira',
            priority: `Установите приоритет "${generatedContent.priority}" в Jira`
          }
        }
      });

    } catch (error) {
      console.error('❌ Ошибка генерации задачи:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Генерирует задачу на основе Jira URL
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async generateFromUrl(req, res) {
    try {
      const schema = Joi.object({
        url: Joi.string().uri().required(),
        description: Joi.string().max(500).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { url, description } = value;

      console.log(`🔗 Генерация задачи из URL: ${url}`);
      
      const generatedContent = await simpleOpenAIService.generateTaskFromUrl(url, description);

      console.log('✅ Задача сгенерирована из URL');

      res.json({
        success: true,
        message: 'Задача успешно сгенерирована из URL',
        data: {
          title: generatedContent.title,
          description: generatedContent.description,
          priority: generatedContent.priority,
          labels: generatedContent.labels,
          assignee_suggestion: generatedContent.assignee_suggestion,
          acceptance_criteria: generatedContent.acceptance_criteria,
          category: generatedContent.category,
          sourceUrl: generatedContent.sourceUrl,
          sourceIssueKey: generatedContent.sourceIssueKey,
          technical_notes: generatedContent.technical_notes,
          ui_notes: generatedContent.ui_notes,
          infrastructure_notes: generatedContent.infrastructure_notes,
          analytics_notes: generatedContent.analytics_notes,
          copy_instructions: {
            title: 'Скопируйте это название в поле "Summary" в Jira',
            description: 'Скопируйте это описание в поле "Description" в Jira',
            labels: 'Добавьте эти метки в поле "Labels" в Jira',
            priority: `Установите приоритет "${generatedContent.priority}" в Jira`
          }
        }
      });

    } catch (error) {
      console.error('❌ Ошибка генерации задачи из URL:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Генерирует несколько вариантов задачи
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async generateVariants(req, res) {
    try {
      const schema = Joi.object({
        description: Joi.string().min(10).max(500).required(),
        category: Joi.string().valid('DevOps', 'Аналитика', 'Backend', 'Frontend', 'Инфраструктура').required(),
        count: Joi.number().min(2).max(5).default(3)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { description, category, count } = value;

      console.log(`🎲 Генерация ${count} вариантов задачи категории "${category}"...`);
      
      const variants = await simpleOpenAIService.generateMultipleVariants(description, category, count);

      console.log(`✅ Сгенерировано ${variants.length} вариантов`);

      res.json({
        success: true,
        message: `Сгенерировано ${variants.length} вариантов задачи`,
        data: {
          variants: variants,
          category: category,
          original_description: description,
          copy_instructions: {
            title: 'Скопируйте выбранное название в поле "Summary" в Jira',
            description: 'Скопируйте выбранное описание в поле "Description" в Jira',
            labels: 'Добавьте выбранные метки в поле "Labels" в Jira',
            priority: 'Установите выбранный приоритет в Jira'
          }
        }
      });

    } catch (error) {
      console.error('❌ Ошибка генерации вариантов:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Получает доступные категории
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async getCategories(req, res) {
    try {
      const categories = [
        {
          key: 'DevOps',
          name: 'DevOps',
          description: 'Задачи по инфраструктуре, мониторингу, CI/CD',
          priority: 'Medium',
          labels: ['devops', 'infrastructure']
        },
        {
          key: 'Аналитика',
          name: 'Аналитика',
          description: 'Аналитические задачи, дашборды, метрики',
          priority: 'High',
          labels: ['analytics', 'data']
        },
        {
          key: 'Backend',
          name: 'Backend',
          description: 'Серверная разработка, API, базы данных',
          priority: 'Medium',
          labels: ['backend', 'development']
        },
        {
          key: 'Frontend',
          name: 'Frontend',
          description: 'Клиентская разработка, UI/UX',
          priority: 'Medium',
          labels: ['frontend', 'ui', 'ux']
        },
        {
          key: 'Инфраструктура',
          name: 'Инфраструктура',
          description: 'Системная инфраструктура, безопасность',
          priority: 'High',
          labels: ['infrastructure', 'system']
        }
      ];

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
   * Проверяет статус подключения к OpenAI
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async healthCheck(req, res) {
    try {
      const checks = {
        openai: false
      };

      // Проверяем OpenAI (простой тест)
      try {
        checks.openai = !!process.env.OPENAI_API_KEY;
      } catch (error) {
        console.error('OpenAI connection check failed:', error.message);
      }

      const allHealthy = Object.values(checks).every(check => check === true);

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        message: allHealthy ? 'Сервис готов к работе' : 'Проверьте настройки OpenAI API'
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
}

module.exports = new SimpleController();

