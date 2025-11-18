const axios = require('axios');
const config = require('../config/config');

class JiraService {
  constructor() {
    this.baseUrl = config.jira.baseUrl;
    this.username = config.jira.username;
    this.apiToken = config.jira.apiToken;
    this.projectKey = config.jira.projectKey;
    this.issueType = config.jira.issueType;
    
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
   * Создает задачу в Jira
   * @param {Object} taskData - Данные задачи
   * @returns {Promise<Object>} Созданная задача
   */
  async createIssue(taskData) {
    try {
      const issueData = {
        fields: {
          project: {
            key: this.projectKey
          },
          issuetype: {
            name: this.issueType
          },
          summary: taskData.title,
          description: {
            type: 'doc',
            version: 1,
            content: this.convertToJiraFormat(taskData.description)
          },
          priority: {
            name: this.mapPriority(taskData.priority)
          },
          labels: taskData.labels || []
        }
      };

      if (taskData.assignee) {
        issueData.fields.assignee = {
          accountId: await this.getAccountIdByEmail(taskData.assignee)
        };
      }

      const response = await this.api.post('/issue', issueData);
      
      return {
        success: true,
        issueKey: response.data.key,
        issueUrl: `${this.baseUrl}/browse/${response.data.key}`,
        issueId: response.data.id
      };
    } catch (error) {
      console.error('Jira API Error:', error.response?.data || error.message);
      throw new Error(`Ошибка при создании задачи в Jira: ${error.message}`);
    }
  }

  /**
   * Получает информацию о проекте
   * @returns {Promise<Object>} Информация о проекте
   */
  async getProjectInfo() {
    try {
      const response = await this.api.get(`/project/${this.projectKey}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения информации о проекте:', error.message);
      throw new Error(`Не удалось получить информацию о проекте: ${error.message}`);
    }
  }

  /**
   * Получает доступные типы задач для проекта
   * @returns {Promise<Array>} Список типов задач
   */
  async getIssueTypes() {
    try {
      const response = await this.api.get(`/project/${this.projectKey}`);
      return response.data.issueTypes;
    } catch (error) {
      console.error('Ошибка получения типов задач:', error.message);
      throw new Error(`Не удалось получить типы задач: ${error.message}`);
    }
  }

  /**
   * Получает информацию о пользователе по email
   * @param {string} email - Email пользователя
   * @returns {Promise<string>} Account ID пользователя
   */
  async getAccountIdByEmail(email) {
    try {
      const response = await this.api.get('/user/search', {
        params: {
          query: email
        }
      });
      
      if (response.data.length === 0) {
        throw new Error(`Пользователь с email ${email} не найден`);
      }
      
      return response.data[0].accountId;
    } catch (error) {
      console.error('Ошибка поиска пользователя:', error.message);
      throw new Error(`Не удалось найти пользователя: ${error.message}`);
    }
  }

  /**
   * Конвертирует markdown текст в формат Jira
   * @param {string} markdown - Markdown текст
   * @returns {Array} Структура документа Jira
   */
  convertToJiraFormat(markdown) {
    const lines = markdown.split('\n');
    const content = [];
    let currentParagraph = [];
    let currentList = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        if (currentParagraph.length > 0) {
          content.push({
            type: 'paragraph',
            content: currentParagraph
          });
          currentParagraph = [];
        }
        if (currentList) {
          content.push(currentList);
          currentList = null;
        }
        continue;
      }

      if (trimmedLine.startsWith('🎯') || trimmedLine.startsWith('📌') || 
          trimmedLine.startsWith('✅') || trimmedLine.startsWith('🏷️') ||
          trimmedLine.startsWith('👥') || trimmedLine.startsWith('🔧') ||
          trimmedLine.startsWith('🛠️') || trimmedLine.startsWith('🎨') ||
          trimmedLine.startsWith('📊')) {
        
        if (currentParagraph.length > 0) {
          content.push({
            type: 'paragraph',
            content: currentParagraph
          });
          currentParagraph = [];
        }
        if (currentList) {
          content.push(currentList);
          currentList = null;
        }

        const headerText = trimmedLine.substring(2).trim();
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{
            type: 'text',
            text: headerText
          }]
        });
      } else if (trimmedLine.startsWith('- ')) {
        if (!currentList) {
          currentList = {
            type: 'bulletList',
            content: []
          };
        }
        
        const listItemText = trimmedLine.substring(2).trim();
        currentList.content.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: listItemText
            }]
          }]
        });
      } else {
        if (currentList) {
          content.push(currentList);
          currentList = null;
        }
        
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const boldText = trimmedLine.substring(2, trimmedLine.length - 2);
          currentParagraph.push({
            type: 'text',
            text: boldText,
            marks: [{ type: 'strong' }]
          });
        } else {
          currentParagraph.push({
            type: 'text',
            text: trimmedLine
          });
        }
      }
    }

    if (currentParagraph.length > 0) {
      content.push({
        type: 'paragraph',
        content: currentParagraph
      });
    }
    if (currentList) {
      content.push(currentList);
    }

    return content;
  }

  /**
   * Маппит приоритет на приоритеты Jira
   * @param {string} priority - Приоритет
   * @returns {string} Приоритет Jira
   */
  mapPriority(priority) {
    const priorityMap = {
      'Low': 'Lowest',
      'Medium': 'Medium',
      'High': 'High',
      'Critical': 'Highest'
    };
    
    return priorityMap[priority] || 'Medium';
  }

  /**
   * Проверяет подключение к Jira
   * @returns {Promise<boolean>} Статус подключения
   */
  async testConnection() {
    try {
      await this.getProjectInfo();
      return true;
    } catch (error) {
      console.error('Ошибка подключения к Jira:', error.message);
      return false;
    }
  }
}

module.exports = new JiraService();
