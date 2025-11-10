const historicalDataService = require('../services/historicalDataService');
const simpleOpenAIService = require('../services/simpleOpenAIService');
const Joi = require('joi');

class HistoricalController {
  /**
   * Парсит исторические задачи из Jira
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async parseHistoricalTasks(req, res) {
    try {
      const schema = Joi.object({
        projectKey: Joi.string().optional(),
        maxResults: Joi.number().min(1).max(1000).default(100),
        startAt: Joi.number().min(0).default(0),
        jql: Joi.string().optional(),
        fields: Joi.array().items(Joi.string()).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const options = value;
      console.log(`📊 Парсинг исторических задач с параметрами:`, options);

      const result = await historicalDataService.parseHistoricalTasks(options);
      
      console.log(`✅ Спарсено ${result.issues.length} задач из ${result.total} общих`);

      res.json({
        success: true,
        message: 'Исторические задачи успешно получены',
        data: {
          total: result.total,
          parsed: result.issues.length,
          hasMore: result.hasMore,
          tasks: result.issues,
          patterns: historicalDataService.analyzePatterns(result.issues),
          templates: historicalDataService.createTemplatesFromHistory(result.issues)
        }
      });

    } catch (error) {
      console.error('❌ Ошибка парсинга исторических задач:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Анализирует паттерны в исторических задачах
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async analyzePatterns(req, res) {
    try {
      const schema = Joi.object({
        projectKey: Joi.string().optional(),
        maxResults: Joi.number().min(10).max(500).default(100)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { projectKey, maxResults } = value;
      console.log(`🔍 Анализ паттернов для проекта ${projectKey}...`);

      // Получаем исторические задачи
      const result = await historicalDataService.parseHistoricalTasks({
        projectKey,
        maxResults
      });

      // Анализируем паттерны
      const patterns = historicalDataService.analyzePatterns(result.issues);
      const templates = historicalDataService.createTemplatesFromHistory(result.issues);

      console.log(`✅ Анализ завершен для ${result.issues.length} задач`);

      res.json({
        success: true,
        message: 'Анализ паттернов завершен',
        data: {
          totalTasks: result.issues.length,
          patterns: {
            categories: patterns.categories,
            priorities: patterns.priorities,
            labels: patterns.labels,
            assignees: patterns.assignees,
            quality: {
              high: patterns.quality.high.length,
              medium: patterns.quality.medium.length,
              low: patterns.quality.low.length
            }
          },
          templates: templates,
          recommendations: this.generateRecommendations(patterns, templates)
        }
      });

    } catch (error) {
      console.error('❌ Ошибка анализа паттернов:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Создает задачу на основе исторических данных
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async createTaskFromHistory(req, res) {
    try {
      const schema = Joi.object({
        description: Joi.string().min(10).max(500).required(),
        category: Joi.string().valid('DevOps', 'Аналитика', 'Backend', 'Frontend', 'Инфраструктура').required(),
        useHistoricalData: Joi.boolean().default(true),
        projectKey: Joi.string().optional(),
        maxHistoricalTasks: Joi.number().min(5).max(100).default(20)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { description, category, useHistoricalData, projectKey, maxHistoricalTasks } = value;

      console.log(`🤖 Создание задачи на основе исторических данных для категории "${category}"...`);

      let historicalContext = '';
      
      if (useHistoricalData) {
        // Получаем исторические задачи для контекста
        const historicalResult = await historicalDataService.parseHistoricalTasks({
          projectKey,
          maxResults: maxHistoricalTasks
        });

        // Фильтруем задачи по категории
        const categoryTasks = historicalResult.issues.filter(task => task.category === category);
        
        if (categoryTasks.length > 0) {
          // Создаем контекст из исторических задач
          historicalContext = this.buildHistoricalContext(categoryTasks);
          console.log(`📚 Используем ${categoryTasks.length} исторических задач как контекст`);
        }
      }

      // Генерируем задачу с учетом исторических данных
      const enhancedDescription = historicalContext 
        ? `${description}\n\nКонтекст из исторических задач:\n${historicalContext}`
        : description;

      const generatedContent = await simpleOpenAIService.generateTaskContent(enhancedDescription, category);

      console.log('✅ Задача создана на основе исторических данных');

      res.json({
        success: true,
        message: 'Задача создана на основе исторических данных',
        data: {
          title: generatedContent.title,
          description: generatedContent.description,
          priority: generatedContent.priority,
          labels: generatedContent.labels,
          assignee_suggestion: generatedContent.assignee_suggestion,
          acceptance_criteria: generatedContent.acceptance_criteria,
          category: category,
          historicalContext: historicalContext ? 'Использован' : 'Не использован',
          copy_instructions: {
            title: 'Скопируйте это название в поле "Summary" в Jira',
            description: 'Скопируйте это описание в поле "Description" в Jira',
            labels: 'Добавьте эти метки в поле "Labels" в Jira',
            priority: `Установите приоритет "${generatedContent.priority}" в Jira`
          }
        }
      });

    } catch (error) {
      console.error('❌ Ошибка создания задачи из исторических данных:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }

  /**
   * Строит контекст из исторических задач
   * @param {Array} tasks - Исторические задачи
   * @returns {string} Контекст
   */
  buildHistoricalContext(tasks) {
    const highQualityTasks = tasks
      .filter(task => task.quality.qualityScore >= 70)
      .slice(0, 5); // Берем только 5 лучших задач

    if (highQualityTasks.length === 0) {
      return '';
    }

    let context = 'Примеры качественных задач из истории:\n\n';
    
    highQualityTasks.forEach((task, index) => {
      context += `${index + 1}. ${task.summary}\n`;
      context += `   Приоритет: ${task.priority}\n`;
      context += `   Метки: ${task.labels.join(', ')}\n`;
      if (task.description && task.description.length > 50) {
        context += `   Описание: ${task.description.substring(0, 200)}...\n`;
      }
      context += '\n';
    });

    return context;
  }

  /**
   * Генерирует рекомендации на основе паттернов
   * @param {Object} patterns - Паттерны
   * @param {Object} templates - Шаблоны
   * @returns {Array} Рекомендации
   */
  generateRecommendations(patterns, templates) {
    const recommendations = [];

    // Рекомендации по категориям
    const topCategories = Object.entries(patterns.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topCategories.length > 0) {
      recommendations.push({
        type: 'categories',
        message: `Наиболее активные категории: ${topCategories.map(([cat]) => cat).join(', ')}`,
        data: topCategories
      });
    }

    // Рекомендации по приоритетам
    const topPriorities = Object.entries(patterns.priorities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);
    
    if (topPriorities.length > 0) {
      recommendations.push({
        type: 'priorities',
        message: `Наиболее используемые приоритеты: ${topPriorities.map(([pri]) => pri).join(', ')}`,
        data: topPriorities
      });
    }

    // Рекомендации по лейблам
    const topLabels = Object.entries(patterns.labels)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topLabels.length > 0) {
      recommendations.push({
        type: 'labels',
        message: `Популярные метки: ${topLabels.map(([label]) => label).join(', ')}`,
        data: topLabels
      });
    }

    // Рекомендации по качеству
    const qualityStats = patterns.quality;
    const totalTasks = qualityStats.high + qualityStats.medium + qualityStats.low;
    const qualityPercentage = Math.round((qualityStats.high / totalTasks) * 100);
    
    recommendations.push({
      type: 'quality',
      message: `Качество задач: ${qualityPercentage}% высокого качества`,
      data: {
        high: qualityStats.high,
        medium: qualityStats.medium,
        low: qualityStats.low,
        percentage: qualityPercentage
      }
    });

    return recommendations;
  }

  /**
   * Получает статистику по историческим задачам
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async getHistoricalStats(req, res) {
    try {
      const { projectKey } = req.params;
      
      console.log(`📊 Получение статистики для проекта ${projectKey}...`);

      const result = await historicalDataService.parseHistoricalTasks({
        projectKey,
        maxResults: 200
      });

      const patterns = historicalDataService.analyzePatterns(result.issues);
      const templates = historicalDataService.createTemplatesFromHistory(result.issues);

      res.json({
        success: true,
        data: {
          project: projectKey,
          totalTasks: result.issues.length,
          categories: patterns.categories,
          priorities: patterns.priorities,
          topLabels: Object.entries(patterns.labels)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10),
          quality: {
            high: patterns.quality.high.length,
            medium: patterns.quality.medium.length,
            low: patterns.quality.low.length
          },
          templates: Object.keys(templates).length,
          recommendations: this.generateRecommendations(patterns, templates)
        }
      });

    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      });
    }
  }
}

module.exports = new HistoricalController();
