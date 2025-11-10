const axios = require('axios');
const config = require('../config/config');

class HistoricalDataService {
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
   * Парсит исторические задачи из Jira
   * @param {Object} options - Опции парсинга
   * @returns {Promise<Array>} Массив исторических задач
   */
  async parseHistoricalTasks(options = {}) {
    try {
      const {
        projectKey = config.jira.projectKey,
        maxResults = 100,
        startAt = 0,
        jql = '',
        fields = ['summary', 'description', 'status', 'priority', 'labels', 'assignee', 'issuetype', 'created', 'updated']
      } = options;

      console.log(`📊 Парсинг исторических задач из проекта ${projectKey}...`);

      // Строим JQL запрос
      let jqlQuery = `project = ${projectKey}`;
      if (jql) {
        jqlQuery = jql;
      }

      const response = await this.api.get('/search', {
        params: {
          jql: jqlQuery,
          maxResults,
          startAt,
          fields: fields.join(',')
        }
      });

      const issues = response.data.issues;
      console.log(`✅ Найдено ${issues.length} исторических задач`);

      // Обрабатываем каждую задачу
      const historicalTasks = issues.map(issue => this.processHistoricalTask(issue));
      
      return {
        total: response.data.total,
        issues: historicalTasks,
        hasMore: response.data.total > startAt + maxResults
      };
    } catch (error) {
      console.error('Ошибка парсинга исторических задач:', error.message);
      throw new Error(`Не удалось получить исторические задачи: ${error.message}`);
    }
  }

  /**
   * Обрабатывает одну историческую задачу
   * @param {Object} issue - Задача из Jira
   * @returns {Object} Обработанная задача
   */
  processHistoricalTask(issue) {
    return {
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      labels: issue.fields.labels || [],
      assignee: issue.fields.assignee?.displayName || 'Не назначен',
      reporter: issue.fields.reporter.displayName,
      issueType: issue.fields.issuetype.name,
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolved: issue.fields.resolutiondate,
      url: `${this.baseUrl}/browse/${issue.key}`,
      // Извлекаем категорию
      category: this.determineCategoryFromTask(issue),
      // Анализируем качество задачи
      quality: this.analyzeTaskQuality(issue)
    };
  }

  /**
   * Определяет категорию задачи на основе её данных
   * @param {Object} issue - Задача из Jira
   * @returns {string} Категория
   */
  determineCategoryFromTask(issue) {
    const summary = issue.fields.summary.toLowerCase();
    const description = (issue.fields.description || '').toLowerCase();
    const labels = (issue.fields.labels || []).map(label => label.toLowerCase());
    const issueType = issue.fields.issuetype.name.toLowerCase();
    
    // Проверяем ключевые слова в названии и описании
    const text = `${summary} ${description}`.toLowerCase();
    
    if (text.includes('devops') || text.includes('ci/cd') || text.includes('deploy') || text.includes('monitoring')) {
      return 'DevOps';
    }
    if (text.includes('analytics') || text.includes('dashboard') || text.includes('metrics') || text.includes('report')) {
      return 'Аналитика';
    }
    if (text.includes('backend') || text.includes('api') || text.includes('server') || text.includes('database')) {
      return 'Backend';
    }
    if (text.includes('frontend') || text.includes('ui') || text.includes('ux') || text.includes('interface')) {
      return 'Frontend';
    }
    if (text.includes('infrastructure') || text.includes('system') || text.includes('security')) {
      return 'Инфраструктура';
    }
    
    // Проверяем лейблы
    if (labels.some(label => ['devops', 'ci-cd', 'deployment', 'monitoring'].includes(label))) {
      return 'DevOps';
    }
    if (labels.some(label => ['analytics', 'dashboard', 'metrics', 'reporting'].includes(label))) {
      return 'Аналитика';
    }
    if (labels.some(label => ['backend', 'api', 'server', 'database'].includes(label))) {
      return 'Backend';
    }
    if (labels.some(label => ['frontend', 'ui', 'ux', 'interface'].includes(label))) {
      return 'Frontend';
    }
    if (labels.some(label => ['infrastructure', 'system', 'security'].includes(label))) {
      return 'Инфраструктура';
    }
    
    // По умолчанию
    return 'Backend';
  }

  /**
   * Анализирует качество задачи
   * @param {Object} issue - Задача из Jira
   * @returns {Object} Анализ качества
   */
  analyzeTaskQuality(issue) {
    const summary = issue.fields.summary;
    const description = issue.fields.description || '';
    const labels = issue.fields.labels || [];
    
    return {
      hasDescription: description.length > 0,
      descriptionLength: description.length,
      hasLabels: labels.length > 0,
      labelCount: labels.length,
      summaryLength: summary.length,
      isWellStructured: this.isWellStructured(description),
      hasAcceptanceCriteria: this.hasAcceptanceCriteria(description),
      hasTechnicalDetails: this.hasTechnicalDetails(description),
      qualityScore: this.calculateQualityScore(issue)
    };
  }

  /**
   * Проверяет, хорошо ли структурировано описание
   * @param {string} description - Описание задачи
   * @returns {boolean} Хорошо ли структурировано
   */
  isWellStructured(description) {
    const structuredIndicators = [
      'цель:', 'goal:', 'задача:', 'task:',
      'критерии:', 'criteria:', 'требования:', 'requirements:',
      'шаги:', 'steps:', 'результат:', 'result:'
    ];
    
    return structuredIndicators.some(indicator => 
      description.toLowerCase().includes(indicator)
    );
  }

  /**
   * Проверяет наличие критериев готовности
   * @param {string} description - Описание задачи
   * @returns {boolean} Есть ли критерии готовности
   */
  hasAcceptanceCriteria(description) {
    const criteriaIndicators = [
      'критерии готовности', 'acceptance criteria',
      'критерии приемки', 'definition of done',
      'готово когда', 'done when'
    ];
    
    return criteriaIndicators.some(indicator => 
      description.toLowerCase().includes(indicator)
    );
  }

  /**
   * Проверяет наличие технических деталей
   * @param {string} description - Описание задачи
   * @returns {boolean} Есть ли технические детали
   */
  hasTechnicalDetails(description) {
    const technicalIndicators = [
      'api', 'database', 'server', 'config',
      'технические', 'technical', 'архитектура',
      'architecture', 'performance', 'производительность'
    ];
    
    return technicalIndicators.some(indicator => 
      description.toLowerCase().includes(indicator)
    );
  }

  /**
   * Вычисляет общий балл качества задачи
   * @param {Object} issue - Задача из Jira
   * @returns {number} Балл качества (0-100)
   */
  calculateQualityScore(issue) {
    let score = 0;
    const description = issue.fields.description || '';
    const labels = issue.fields.labels || [];
    
    // Базовые баллы
    if (description.length > 0) score += 20;
    if (description.length > 100) score += 10;
    if (description.length > 500) score += 10;
    if (labels.length > 0) score += 10;
    if (labels.length > 2) score += 10;
    
    // Структурированность
    if (this.isWellStructured(description)) score += 15;
    if (this.hasAcceptanceCriteria(description)) score += 15;
    if (this.hasTechnicalDetails(description)) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Анализирует паттерны в исторических задачах
   * @param {Array} historicalTasks - Исторические задачи
   * @returns {Object} Анализ паттернов
   */
  analyzePatterns(historicalTasks) {
    const patterns = {
      categories: {},
      priorities: {},
      labels: {},
      assignees: {},
      quality: {
        high: [],
        medium: [],
        low: []
      }
    };

    historicalTasks.forEach(task => {
      // Категории
      patterns.categories[task.category] = (patterns.categories[task.category] || 0) + 1;
      
      // Приоритеты
      patterns.priorities[task.priority] = (patterns.priorities[task.priority] || 0) + 1;
      
      // Лейблы
      task.labels.forEach(label => {
        patterns.labels[label] = (patterns.labels[label] || 0) + 1;
      });
      
      // Исполнители
      if (task.assignee !== 'Не назначен') {
        patterns.assignees[task.assignee] = (patterns.assignees[task.assignee] || 0) + 1;
      }
      
      // Качество
      if (task.quality.qualityScore >= 80) {
        patterns.quality.high.push(task);
      } else if (task.quality.qualityScore >= 60) {
        patterns.quality.medium.push(task);
      } else {
        patterns.quality.low.push(task);
      }
    });

    return patterns;
  }

  /**
   * Создает шаблоны на основе исторических данных
   * @param {Array} historicalTasks - Исторические задачи
   * @returns {Object} Шаблоны
   */
  createTemplatesFromHistory(historicalTasks) {
    const patterns = this.analyzePatterns(historicalTasks);
    const templates = {};

    // Создаем шаблоны для каждой категории
    Object.keys(patterns.categories).forEach(category => {
      const categoryTasks = historicalTasks.filter(task => task.category === category);
      const highQualityTasks = categoryTasks.filter(task => task.quality.qualityScore >= 80);
      
      if (highQualityTasks.length > 0) {
        templates[category] = this.createTemplateFromTasks(category, highQualityTasks);
      }
    });

    return templates;
  }

  /**
   * Создает шаблон на основе задач категории
   * @param {string} category - Категория
   * @param {Array} tasks - Задачи категории
   * @returns {Object} Шаблон
   */
  createTemplateFromTasks(category, tasks) {
    // Анализируем общие паттерны
    const commonLabels = this.getCommonLabels(tasks);
    const commonPriority = this.getCommonPriority(tasks);
    const commonAssignee = this.getCommonAssignee(tasks);
    
    // Создаем шаблон описания
    const descriptionTemplate = this.createDescriptionTemplate(tasks);
    
    return {
      name: category,
      priority: commonPriority,
      labels: commonLabels,
      assignee_rule: commonAssignee,
      template: {
        title: `[${category}] {{task_summary}}`,
        description: descriptionTemplate
      },
      basedOn: tasks.length,
      qualityScore: this.calculateAverageQuality(tasks)
    };
  }

  /**
   * Получает общие лейблы
   * @param {Array} tasks - Задачи
   * @returns {Array} Общие лейблы
   */
  getCommonLabels(tasks) {
    const labelCounts = {};
    
    tasks.forEach(task => {
      task.labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
    });
    
    // Возвращаем лейблы, которые встречаются в более чем 50% задач
    const threshold = tasks.length * 0.5;
    return Object.keys(labelCounts)
      .filter(label => labelCounts[label] >= threshold)
      .sort((a, b) => labelCounts[b] - labelCounts[a]);
  }

  /**
   * Получает общий приоритет
   * @param {Array} tasks - Задачи
   * @returns {string} Общий приоритет
   */
  getCommonPriority(tasks) {
    const priorityCounts = {};
    
    tasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });
    
    return Object.keys(priorityCounts)
      .sort((a, b) => priorityCounts[b] - priorityCounts[a])[0];
  }

  /**
   * Получает общего исполнителя
   * @param {Array} tasks - Задачи
   * @returns {string} Общий исполнитель
   */
  getCommonAssignee(tasks) {
    const assigneeCounts = {};
    
    tasks.forEach(task => {
      if (task.assignee !== 'Не назначен') {
        assigneeCounts[task.assignee] = (assigneeCounts[task.assignee] || 0) + 1;
      }
    });
    
    const commonAssignee = Object.keys(assigneeCounts)
      .sort((a, b) => assigneeCounts[b] - assigneeCounts[a])[0];
    
    return commonAssignee || 'auto-assign';
  }

  /**
   * Создает шаблон описания на основе задач
   * @param {Array} tasks - Задачи
   * @returns {string} Шаблон описания
   */
  createDescriptionTemplate(tasks) {
    // Анализируем структуру описаний
    const structures = tasks.map(task => this.extractDescriptionStructure(task.description));
    const commonStructure = this.findCommonStructure(structures);
    
    return this.buildDescriptionTemplate(commonStructure);
  }

  /**
   * Извлекает структуру описания
   * @param {string} description - Описание
   * @returns {Object} Структура
   */
  extractDescriptionStructure(description) {
    const lines = description.split('\n');
    const structure = {
      hasGoal: false,
      hasTasks: false,
      hasCriteria: false,
      hasTechnical: false,
      sections: []
    };
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('цель') || lowerLine.includes('goal')) {
        structure.hasGoal = true;
        structure.sections.push('goal');
      }
      if (lowerLine.includes('задача') || lowerLine.includes('task') || lowerLine.includes('что нужно')) {
        structure.hasTasks = true;
        structure.sections.push('tasks');
      }
      if (lowerLine.includes('критерии') || lowerLine.includes('criteria')) {
        structure.hasCriteria = true;
        structure.sections.push('criteria');
      }
      if (lowerLine.includes('технические') || lowerLine.includes('technical')) {
        structure.hasTechnical = true;
        structure.sections.push('technical');
      }
    });
    
    return structure;
  }

  /**
   * Находит общую структуру
   * @param {Array} structures - Структуры
   * @returns {Object} Общая структура
   */
  findCommonStructure(structures) {
    const common = {
      hasGoal: structures.filter(s => s.hasGoal).length > structures.length * 0.5,
      hasTasks: structures.filter(s => s.hasTasks).length > structures.length * 0.5,
      hasCriteria: structures.filter(s => s.hasCriteria).length > structures.length * 0.5,
      hasTechnical: structures.filter(s => s.hasTechnical).length > structures.length * 0.5
    };
    
    return common;
  }

  /**
   * Строит шаблон описания
   * @param {Object} structure - Структура
   * @returns {string} Шаблон
   */
  buildDescriptionTemplate(structure) {
    let template = '';
    
    if (structure.hasGoal) {
      template += '🎯 **Цель:** {{goal}}\n\n';
    }
    
    if (structure.hasTasks) {
      template += '📌 **Что нужно сделать:**\n\n{{tasks}}\n\n';
    }
    
    if (structure.hasCriteria) {
      template += '✅ **Критерии готовности:**\n\n{{acceptance_criteria}}\n\n';
    }
    
    if (structure.hasTechnical) {
      template += '🔧 **Технические требования:**\n\n{{technical_requirements}}\n\n';
    }
    
    template += '🏷️ **Приоритет:** {{priority}}\n\n';
    template += '👥 **Исполнитель:** {{assignee}}';
    
    return template;
  }

  /**
   * Вычисляет средний балл качества
   * @param {Array} tasks - Задачи
   * @returns {number} Средний балл
   */
  calculateAverageQuality(tasks) {
    const totalScore = tasks.reduce((sum, task) => sum + task.quality.qualityScore, 0);
    return Math.round(totalScore / tasks.length);
  }
}

module.exports = new HistoricalDataService();


