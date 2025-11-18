const jiraUrlParser = require('../services/jiraUrlParser');
const openaiService = require('../services/openaiService');
const jiraService = require('../services/jiraService');
const templates = require('../config/templates.json');
const Joi = require('joi');

class JiraUrlController {
  /**
   * Анализирует Jira URL и возвращает информацию
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async analyzeUrl(req, res) {
    try {
      const schema = Joi.object({
        url: Joi.string().uri().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { url } = value;
      console.log(`🔍 Анализ Jira URL: ${url}`);

      const analysis = await jiraUrlParser.analyzeJiraUrl(url);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('❌ Ошибка анализа URL:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка анализа URL',
        message: error.message
      });
    }
  }

  /**
   * Создает задачу на основе Jira URL
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async createTaskFromUrl(req, res) {
    try {
      const schema = Joi.object({
        url: Joi.string().uri().required(),
        targetProject: Joi.string().optional(),
        assignee: Joi.string().email().optional(),
        additionalInfo: Joi.string().optional(),
        useAI: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { url, targetProject, assignee, additionalInfo, useAI } = value;
      console.log(`🔄 Создание задачи из URL: ${url}`);

      const analysis = await jiraUrlParser.analyzeJiraUrl(url);
      
      if (!analysis.issueInfo) {
        return res.status(400).json({
          success: false,
          error: 'Не удалось получить информацию об исходной задаче',
          message: 'URL должен содержать ссылку на существующую задачу Jira'
        });
      }

      const sourceIssue = analysis.issueInfo;
      
      const category = jiraUrlParser.determineCategory(sourceIssue);
      console.log(`📋 Определена категория: ${category}`);

      let taskData;
      
      if (useAI) {
        const aiDescription = `Создать задачу на основе: ${sourceIssue.summary}. ${additionalInfo || ''}`;
        
        const generatedContent = await openaiService.generateTaskContent(
          aiDescription,
          category,
          templates.categories[category].template
        );

        const formattedContent = openaiService.formatContentByTemplate(
          generatedContent,
          templates.categories[category].template
        );

        taskData = {
          title: formattedContent.title,
          description: formattedContent.description,
          priority: formattedContent.priority,
          labels: [...formattedContent.labels, ...templates.categories[category].labels],
          assignee: assignee || templates.default_assignees[templates.categories[category].assignee_rule]
        };
      } else {
        const description = jiraUrlParser.createDescriptionFromIssue(sourceIssue, { additionalInfo });
        
        taskData = {
          title: `[${category}] ${sourceIssue.summary}`,
          description: description,
          priority: jiraUrlParser.mapPriority(sourceIssue.priority),
          labels: [...sourceIssue.labels, ...templates.categories[category].labels],
          assignee: assignee || jiraUrlParser.getDefaultAssignee(category)
        };
      }

      console.log(`📝 Создание задачи: ${taskData.title}`);
      const jiraResult = await jiraService.createIssue(taskData);

      console.log(`✅ Задача создана: ${jiraResult.issueKey}`);

      res.status(201).json({
        success: true,
        message: 'Задача успешно создана на основе URL',
        data: {
          issueKey: jiraResult.issueKey,
          issueUrl: jiraResult.issueUrl,
          title: taskData.title,
          category: category,
          priority: taskData.priority,
          labels: taskData.labels,
          assignee: taskData.assignee,
          sourceIssue: {
            key: sourceIssue.key,
            url: sourceIssue.url,
            summary: sourceIssue.summary
          }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка создания задачи из URL:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка создания задачи',
        message: error.message
      });
    }
  }

  /**
   * Получает информацию о задаче по ключу
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async getIssueInfo(req, res) {
    try {
      const { issueKey } = req.params;
      
      if (!issueKey) {
        return res.status(400).json({
          success: false,
          error: 'Не указан ключ задачи',
          message: 'Параметр issueKey обязателен'
        });
      }

      console.log(`🔍 Получение информации о задаче: ${issueKey}`);
      
      const issueInfo = await jiraUrlParser.getIssueInfo(issueKey);
      
      res.json({
        success: true,
        data: issueInfo
      });
    } catch (error) {
      console.error('❌ Ошибка получения информации о задаче:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения информации о задаче',
        message: error.message
      });
    }
  }

  /**
   * Получает информацию о проекте
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async getProjectInfo(req, res) {
    try {
      const { projectKey } = req.params;
      
      if (!projectKey) {
        return res.status(400).json({
          success: false,
          error: 'Не указан ключ проекта',
          message: 'Параметр projectKey обязателен'
        });
      }

      console.log(`🔍 Получение информации о проекте: ${projectKey}`);
      
      const projectInfo = await jiraUrlParser.getProjectInfo(projectKey);
      
      res.json({
        success: true,
        data: projectInfo
      });
    } catch (error) {
      console.error('❌ Ошибка получения информации о проекте:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка получения информации о проекте',
        message: error.message
      });
    }
  }

  /**
   * Клонирует задачу в другой проект
   * @param {Object} req - Запрос
   * @param {Object} res - Ответ
   */
  async cloneTask(req, res) {
    try {
      const schema = Joi.object({
        sourceUrl: Joi.string().uri().required(),
        targetProject: Joi.string().required(),
        targetIssueType: Joi.string().optional(),
        assignee: Joi.string().email().optional(),
        additionalInfo: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: error.details[0].message
        });
      }

      const { sourceUrl, targetProject, targetIssueType, assignee, additionalInfo } = value;
      console.log(`🔄 Клонирование задачи из ${sourceUrl} в проект ${targetProject}`);

      const analysis = await jiraUrlParser.analyzeJiraUrl(sourceUrl);
      
      if (!analysis.issueInfo) {
        return res.status(400).json({
          success: false,
          error: 'Не удалось получить информацию об исходной задаче'
        });
      }

      const sourceIssue = analysis.issueInfo;
      const category = jiraUrlParser.determineCategory(sourceIssue);
      
      const description = jiraUrlParser.createDescriptionFromIssue(sourceIssue, { additionalInfo });
      
      const taskData = {
        title: `[${category}] ${sourceIssue.summary}`,
        description: description,
        priority: jiraUrlParser.mapPriority(sourceIssue.priority),
        labels: sourceIssue.labels,
        assignee: assignee || jiraUrlParser.getDefaultAssignee(category)
      };

      const jiraResult = await jiraService.createIssue(taskData);

      res.status(201).json({
        success: true,
        message: 'Задача успешно клонирована',
        data: {
          issueKey: jiraResult.issueKey,
          issueUrl: jiraResult.issueUrl,
          title: taskData.title,
          category: category,
          priority: taskData.priority,
          labels: taskData.labels,
          assignee: taskData.assignee,
          sourceIssue: {
            key: sourceIssue.key,
            url: sourceIssue.url,
            summary: sourceIssue.summary
          }
        }
      });
    } catch (error) {
      console.error('❌ Ошибка клонирования задачи:', error.message);
      res.status(500).json({
        success: false,
        error: 'Ошибка клонирования задачи',
        message: error.message
      });
    }
  }
}

module.exports = new JiraUrlController();
