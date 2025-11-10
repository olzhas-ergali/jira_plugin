const axios = require('axios');
const config = require('../config/config');

class SimpleOpenAIService {
  constructor() {
    this.apiKey = config.openai.apiKey;
    this.model = config.openai.model;
    this.maxTokens = config.openai.maxTokens;
    this.temperature = config.openai.temperature;
  }

  /**
   * Генерирует контент для задачи с помощью OpenAI
   * @param {string} description - Краткое описание задачи
   * @param {string} category - Категория задачи
   * @returns {Promise<Object>} Сгенерированный контент
   */
  async generateTaskContent(description, category) {
    try {
      const prompt = this.buildPrompt(description, category);
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по созданию технических задач. Генерируй качественные описания задач в формате JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      return this.parseGeneratedContent(content);
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`Ошибка при генерации контента: ${error.message}`);
    }
  }

  /**
   * Строит промпт для OpenAI
   * @param {string} description - Описание задачи
   * @param {string} category - Категория
   * @returns {string} Промпт
   */
  buildPrompt(description, category) {
    return `
Создай техническое задание для задачи категории "${category}".

Исходное описание: "${description}"

Верни результат в формате JSON:

{
  "title": "Название задачи",
  "description": "Подробное описание задачи в формате Jira",
  "priority": "Low/Medium/High",
  "labels": ["метка1", "метка2"],
  "assignee_suggestion": "Предложение исполнителя",
  "acceptance_criteria": [
    "критерий 1",
    "критерий 2",
    "критерий 3"
  ],
  "technical_notes": "Технические заметки (только для Backend/DevOps)",
  "ui_notes": "UI/UX заметки (только для Frontend)",
  "infrastructure_notes": "Инфраструктурные заметки (только для Инфраструктура)",
  "analytics_notes": "Аналитические заметки (только для Аналитика)"
}

Важно:
- Используй профессиональную терминологию
- Описание должно быть готово для копирования в Jira
- Критерии готовности должны быть измеримыми
- Приоритет должен соответствовать важности задачи
- Добавь релевантные метки
- Заполни только те поля, которые соответствуют категории задачи
`;
  }

  /**
   * Парсит сгенерированный контент
   * @param {string} content - Сгенерированный контент
   * @returns {Object} Распарсенный контент
   */
  parseGeneratedContent(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось найти JSON в ответе OpenAI');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const requiredFields = ['title', 'description', 'priority', 'labels'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
      }

      return parsed;
    } catch (error) {
      console.error('Ошибка парсинга контента:', error.message);
      throw new Error(`Ошибка парсинга сгенерированного контента: ${error.message}`);
    }
  }

  /**
   * Генерирует задачу на основе Jira URL
   * @param {string} url - Jira URL
   * @param {string} description - Дополнительное описание
   * @returns {Promise<Object>} Сгенерированная задача
   */
  async generateTaskFromUrl(url, description = '') {
    try {
      // Извлекаем информацию из URL
      const urlInfo = this.parseJiraUrl(url);
      
      if (!urlInfo.issueKey) {
        throw new Error('Не удалось извлечь ключ задачи из URL');
      }

      // Определяем категорию на основе URL
      const category = this.determineCategoryFromUrl(url);
      
      // Создаем описание для генерации
      const promptDescription = `${description} Задача: ${urlInfo.issueKey}`;
      
      // Генерируем контент
      const generatedContent = await this.generateTaskContent(promptDescription, category);
      
      return {
        ...generatedContent,
        sourceUrl: url,
        sourceIssueKey: urlInfo.issueKey,
        category: category
      };
    } catch (error) {
      console.error('Ошибка генерации задачи из URL:', error.message);
      throw error;
    }
  }

  /**
   * Парсит Jira URL
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
      
      return {
        issueKey,
        projectKey,
        baseUrl: `${urlObj.protocol}//${urlObj.host}`,
        originalUrl: url,
        isValid: !!issueKey
      };
    } catch (error) {
      throw new Error(`Ошибка парсинга URL: ${error.message}`);
    }
  }

  /**
   * Определяет категорию на основе URL
   * @param {string} url - Jira URL
   * @returns {string} Категория
   */
  determineCategoryFromUrl(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('devops') || urlLower.includes('ci-cd')) {
      return 'DevOps';
    }
    if (urlLower.includes('analytics') || urlLower.includes('dashboard')) {
      return 'Аналитика';
    }
    if (urlLower.includes('backend') || urlLower.includes('api')) {
      return 'Backend';
    }
    if (urlLower.includes('frontend') || urlLower.includes('ui')) {
      return 'Frontend';
    }
    if (urlLower.includes('infrastructure') || urlLower.includes('system')) {
      return 'Инфраструктура';
    }
    
    return 'Backend'; // По умолчанию
  }

  /**
   * Генерирует несколько вариантов задач
   * @param {string} description - Описание задачи
   * @param {string} category - Категория
   * @param {number} count - Количество вариантов
   * @returns {Promise<Array>} Массив вариантов
   */
  async generateMultipleVariants(description, category, count = 3) {
    try {
      const variants = [];
      
      for (let i = 0; i < count; i++) {
        const variantDescription = `${description} (Вариант ${i + 1})`;
        const content = await this.generateTaskContent(variantDescription, category);
        variants.push({
          ...content,
          variant: i + 1
        });
        
        // Небольшая задержка между запросами
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return variants;
    } catch (error) {
      console.error('Ошибка генерации вариантов:', error.message);
      throw error;
    }
  }
}

module.exports = new SimpleOpenAIService();

