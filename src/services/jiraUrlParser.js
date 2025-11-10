const axios = require('axios');
const config = require('../config/config');

class JiraUrlParser {
  constructor() {
    this.baseUrl = config.jira.baseUrl;
    this.username = config.jira.username;
    this.apiToken = config.jira.apiToken;
    
    this.api = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      auth: {
        username: this.username,
        password: this.apiToken
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Парсит Jira URL и извлекает информацию
   * @param {string} url - Jira URL
   * @returns {Object} Парсированная информация
   */
  parseJiraUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Извлекаем issue key из URL
      const issueKeyMatch = url.match(/([A-Z]+-\d+)/);
      const issueKey = issueKeyMatch ? issueKeyMatch[1] : null;
      
      // Извлекаем project key
      const projectKeyMatch = url.match(/projectKey=([A-Z]+)/);
      const projectKey = projectKeyMatch ? projectKeyMatch[1] : null;
      
      // Извлекаем rapid view ID
      const rapidViewMatch = url.match(/rapidView=(\d+)/);
      const rapidViewId = rapidViewMatch ? rapidViewMatch[1] : null;
      
      return {
        issueKey,
        projectKey,
        rapidViewId,
        baseUrl: `${urlObj.protocol}//${urlObj.host}`,
        originalUrl: url,
        isValid: !!(issueKey || projectKey)
      };
    } catch (error) {
      throw new Error(`Ошибка парсинга URL: ${error.message}`);
    }
  }

  /**
   * Получает информацию о задаче по issue key
   * @param {string} issueKey - Issue key (e.g., PROJ-123)
   * @returns {Promise<Object>} Информация о задаче
   */
  async getIssueInfo(issueKey) {
    try {
      const response = await this.api.get(`/issue/${issueKey}`);
      const issue = response.data;
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status.name,
        priority: issue.fields.priority.name,
        assignee: issue.fields.assignee?.displayName || 'Не назначен',
        reporter: issue.fields.reporter.displayName,
        created: issue.fields.created,
        updated: issue.fields.updated,
        labels: issue.fields.labels || [],
        issueType: issue.fields.issuetype.name,
        project: {
          key: issue.fields.project.key,
          name: issue.fields.project.name
        },
        url: `${this.baseUrl}/browse/${issue.key}`
      };
    } catch (error) {
      console.error('Ошибка получения информации о задаче:', error.message);
      throw new Error(`Не удалось получить информацию о задаче ${issueKey}: ${error.message}`);
    }
  }

  /**
   * Получает информацию о проекте
   * @param {string} projectKey - Ключ проекта
   * @returns {Promise<Object>} Информация о проекте
   */
  async getProjectInfo(projectKey) {
    try {
      const response = await this.api.get(`/project/${projectKey}`);
      const project = response.data;
      
      return {
        key: project.key,
        name: project.name,
        description: project.description,
        lead: project.lead.displayName,
        issueTypes: project.issueTypes.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description
        })),
        url: `${this.baseUrl}/browse/${project.key}`
      };
    } catch (error) {
      console.error('Ошибка получения информации о проекте:', error.message);
      throw new Error(`Не удалось получить информацию о проекте ${projectKey}: ${error.message}`);
    }
  }

  /**
   * Получает информацию о Rapid View
   * @param {string} rapidViewId - ID Rapid View
   * @returns {Promise<Object>} Информация о Rapid View
   */
  async getRapidViewInfo(rapidViewId) {
    try {
      const response = await this.api.get(`/rapidview/${rapidViewId}`);
      const rapidView = response.data;
      
      return {
        id: rapidView.id,
        name: rapidView.name,
        description: rapidView.description,
        projectKey: rapidView.projectKey,
        url: `${this.baseUrl}/secure/RapidBoard.jspa?rapidView=${rapidViewId}`
      };
    } catch (error) {
      console.error('Ошибка получения информации о Rapid View:', error.message);
      throw new Error(`Не удалось получить информацию о Rapid View ${rapidViewId}: ${error.message}`);
    }
  }

  /**
   * Анализирует Jira URL и возвращает полную информацию
   * @param {string} url - Jira URL
   * @returns {Promise<Object>} Полная информация
   */
  async analyzeJiraUrl(url) {
    try {
      const parsed = this.parseJiraUrl(url);
      
      if (!parsed.isValid) {
        throw new Error('Неверный Jira URL');
      }

      const result = {
        parsed,
        issueInfo: null,
        projectInfo: null,
        rapidViewInfo: null
      };

      // Получаем информацию о задаче, если есть issue key
      if (parsed.issueKey) {
        try {
          result.issueInfo = await this.getIssueInfo(parsed.issueKey);
        } catch (error) {
          console.warn('Не удалось получить информацию о задаче:', error.message);
        }
      }

      // Получаем информацию о проекте
      if (parsed.projectKey) {
        try {
          result.projectInfo = await this.getProjectInfo(parsed.projectKey);
        } catch (error) {
          console.warn('Не удалось получить информацию о проекте:', error.message);
        }
      }

      // Получаем информацию о Rapid View
      if (parsed.rapidViewId) {
        try {
          result.rapidViewInfo = await this.getRapidViewInfo(parsed.rapidViewId);
        } catch (error) {
          console.warn('Не удалось получить информацию о Rapid View:', error.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Ошибка анализа Jira URL:', error.message);
      throw error;
    }
  }

  /**
   * Создает задачу на основе существующей задачи
   * @param {string} sourceUrl - URL исходной задачи
   * @param {Object} options - Опции создания
   * @returns {Promise<Object>} Результат создания
   */
  async createTaskFromUrl(sourceUrl, options = {}) {
    try {
      const analysis = await this.analyzeJiraUrl(sourceUrl);
      
      if (!analysis.issueInfo) {
        throw new Error('Не удалось получить информацию об исходной задаче');
      }

      const sourceIssue = analysis.issueInfo;
      
      // Определяем категорию на основе типа задачи или лейблов
      const category = this.determineCategory(sourceIssue);
      
      // Создаем описание для новой задачи
      const description = this.createDescriptionFromIssue(sourceIssue, options);
      
      return {
        sourceIssue,
        category,
        description,
        suggestedTitle: `[${category}] ${sourceIssue.summary}`,
        suggestedAssignee: options.assignee || this.getDefaultAssignee(category),
        suggestedPriority: this.mapPriority(sourceIssue.priority),
        suggestedLabels: this.extractLabels(sourceIssue)
      };
    } catch (error) {
      console.error('Ошибка создания задачи из URL:', error.message);
      throw error;
    }
  }

  /**
   * Определяет категорию на основе информации о задаче
   * @param {Object} issueInfo - Информация о задаче
   * @returns {string} Категория
   */
  determineCategory(issueInfo) {
    const summary = issueInfo.summary.toLowerCase();
    const labels = issueInfo.labels.map(label => label.toLowerCase());
    const issueType = issueInfo.issueType.toLowerCase();
    
    // Проверяем ключевые слова в названии
    if (summary.includes('devops') || summary.includes('ci/cd') || summary.includes('deploy')) {
      return 'DevOps';
    }
    if (summary.includes('analytics') || summary.includes('dashboard') || summary.includes('metrics')) {
      return 'Аналитика';
    }
    if (summary.includes('backend') || summary.includes('api') || summary.includes('server')) {
      return 'Backend';
    }
    if (summary.includes('frontend') || summary.includes('ui') || summary.includes('ux')) {
      return 'Frontend';
    }
    if (summary.includes('infrastructure') || summary.includes('server') || summary.includes('system')) {
      return 'Инфраструктура';
    }
    
    // Проверяем лейблы
    if (labels.some(label => ['devops', 'ci-cd', 'deployment'].includes(label))) {
      return 'DevOps';
    }
    if (labels.some(label => ['analytics', 'dashboard', 'metrics'].includes(label))) {
      return 'Аналитика';
    }
    if (labels.some(label => ['backend', 'api', 'server'].includes(label))) {
      return 'Backend';
    }
    if (labels.some(label => ['frontend', 'ui', 'ux'].includes(label))) {
      return 'Frontend';
    }
    if (labels.some(label => ['infrastructure', 'system'].includes(label))) {
      return 'Инфраструктура';
    }
    
    // По умолчанию
    return 'Backend';
  }

  /**
   * Создает описание на основе существующей задачи
   * @param {Object} issueInfo - Информация о задаче
   * @param {Object} options - Опции
   * @returns {string} Описание
   */
  createDescriptionFromIssue(issueInfo, options = {}) {
    let description = `Создано на основе задачи: ${issueInfo.key}\n\n`;
    
    if (issueInfo.description) {
      description += `**Исходное описание:**\n${issueInfo.description}\n\n`;
    }
    
    description += `**Статус:** ${issueInfo.status}\n`;
    description += `**Приоритет:** ${issueInfo.priority}\n`;
    description += `**Исполнитель:** ${issueInfo.assignee}\n`;
    
    if (issueInfo.labels.length > 0) {
      description += `**Метки:** ${issueInfo.labels.join(', ')}\n`;
    }
    
    if (options.additionalInfo) {
      description += `\n**Дополнительная информация:**\n${options.additionalInfo}`;
    }
    
    return description;
  }

  /**
   * Получает исполнителя по умолчанию для категории
   * @param {string} category - Категория
   * @returns {string} Email исполнителя
   */
  getDefaultAssignee(category) {
    const assignees = {
      'DevOps': 'user@example.com',
      'Аналитика': 'user@example.com',
      'Backend': 'user@example.com',
      'Frontend': 'user@example.com',
      'Инфраструктура': 'user@example.com'
    };
    
    return assignees[category] || 'user@example.com';
  }

  /**
   * Маппит приоритет Jira на наш формат
   * @param {string} jiraPriority - Приоритет Jira
   * @returns {string} Наш приоритет
   */
  mapPriority(jiraPriority) {
    const priorityMap = {
      'Highest': 'High',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low',
      'Lowest': 'Low'
    };
    
    return priorityMap[jiraPriority] || 'Medium';
  }

  /**
   * Извлекает лейблы из задачи
   * @param {Object} issueInfo - Информация о задаче
   * @returns {Array} Лейблы
   */
  extractLabels(issueInfo) {
    return issueInfo.labels || [];
  }
}

module.exports = new JiraUrlParser();
