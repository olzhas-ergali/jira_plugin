const axios = require('axios');
const config = require('../config/config');

class OpenAIService {
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
   * @param {Object} template - Шаблон для генерации
   * @returns {Promise<Object>} Сгенерированный контент
   */
  async generateTaskContent(description, category, template) {
    try {
      const prompt = this.buildPrompt(description, category, template);
      
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
   * @param {Object} template - Шаблон
   * @returns {string} Промпт
   */
  buildPrompt(description, category, template) {
    return `
Создай техническое задание для задачи категории "${category}".

Исходное описание: "${description}"

Используй следующий шаблон и верни результат в формате JSON:

{
  "task_summary": "краткое название задачи",
  "goal": "цель задачи",
  "tasks": [
    "пункт 1",
    "пункт 2",
    "пункт 3"
  ],
  "acceptance_criteria": [
    "критерий 1",
    "критерий 2",
    "критерий 3"
  ],
  "priority": "Low/Medium/High",
  "labels": ["метка1", "метка2"],
  "technical_requirements": "технические требования (только для Backend)",
  "ui_requirements": "UI/UX требования (только для Frontend)",
  "infrastructure_requirements": "инфраструктурные требования (только для Инфраструктура)",
  "metrics": "метрики для отслеживания (только для Аналитика)"
}

Важно:
- Используй профессиональную терминологию
- Задачи должны быть конкретными и выполнимыми
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
      
      const requiredFields = ['task_summary', 'goal', 'tasks', 'acceptance_criteria'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
      }

      return parsed;
    } catch (error) {
      console.error('Ошибка парсинга контента:', error.message);
      console.error('Исходный контент:', content);
      throw new Error(`Ошибка парсинга сгенерированного контента: ${error.message}`);
    }
  }

  /**
   * Форматирует контент по шаблону
   * @param {Object} content - Сгенерированный контент
   * @param {Object} template - Шаблон
   * @returns {Object} Отформатированный контент
   */
  formatContentByTemplate(content, template) {
    const formattedContent = {
      title: template.title,
      description: template.description
    };

    formattedContent.title = formattedContent.title.replace('{{task_summary}}', content.task_summary);

    let description = formattedContent.description;
    description = description.replace('{{goal}}', content.goal);
    description = description.replace('{{tasks}}', content.tasks.map(task => `- ${task}`).join('\n'));
    description = description.replace('{{acceptance_criteria}}', content.acceptance_criteria.map(criteria => `- ${criteria}`).join('\n'));
    description = description.replace('{{priority}}', content.priority || 'Medium');
    description = description.replace('{{assignee}}', 'Автоматическое назначение');

    if (content.technical_requirements) {
      description = description.replace('{{technical_requirements}}', content.technical_requirements);
    }
    if (content.ui_requirements) {
      description = description.replace('{{ui_requirements}}', content.ui_requirements);
    }
    if (content.infrastructure_requirements) {
      description = description.replace('{{infrastructure_requirements}}', content.infrastructure_requirements);
    }
    if (content.metrics) {
      description = description.replace('{{metrics}}', content.metrics);
    }

    formattedContent.description = description;
    formattedContent.labels = content.labels || [];
    formattedContent.priority = content.priority || 'Medium';

    return formattedContent;
  }
}

module.exports = new OpenAIService();
