import { storage } from '@forge/api';

export class TemplateService {
  constructor() {
    this.storageKey = 'templates';
  }

  /**
   * Получает шаблон для категории
   * @param {string} category - Категория задачи
   * @returns {Promise<Object>} Шаблон
   */
  async getTemplate(category) {
    try {
      const templates = await storage.get(this.storageKey) || this.getDefaultTemplates();
      return templates.categories[category] || templates.categories['Backend'];
    } catch (error) {
      console.error('Error getting template:', error);
      return this.getDefaultTemplates().categories['Backend'];
    }
  }

  /**
   * Сохраняет шаблон
   * @param {string} category - Категория
   * @param {Object} template - Шаблон
   * @returns {Promise<void>}
   */
  async saveTemplate(category, template) {
    try {
      const templates = await storage.get(this.storageKey) || this.getDefaultTemplates();
      templates.categories[category] = template;
      await storage.set(this.storageKey, templates);
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error(`Не удалось сохранить шаблон для категории ${category}: ${error.message}`);
    }
  }

  /**
   * Получает все шаблоны
   * @returns {Promise<Object>} Все шаблоны
   */
  async getAllTemplates() {
    try {
      return await storage.get(this.storageKey) || this.getDefaultTemplates();
    } catch (error) {
      console.error('Error getting all templates:', error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Возвращает шаблоны по умолчанию
   * @returns {Object} Шаблоны по умолчанию
   */
  getDefaultTemplates() {
    return {
      categories: {
        "DevOps": {
          name: "DevOps",
          priority: "Medium",
          labels: ["devops", "infrastructure"],
          assignee_rule: "devops-team",
          template: {
            title: "[DevOps] {{task_summary}}",
            description: "🎯 **Цель:** {{goal}}\n\n📌 **Что нужно сделать:**\n\n{{tasks}}\n\n✅ **Критерии готовности:**\n\n{{acceptance_criteria}}\n\n🏷️ **Приоритет:** {{priority}}\n\n👥 **Исполнитель:** {{assignee}}"
          }
        },
        "Аналитика": {
          name: "Аналитика",
          priority: "High",
          labels: ["analytics", "data"],
          assignee_rule: "analytics-team",
          template: {
            title: "[Аналитика] {{task_summary}}",
            description: "🎯 **Цель:** {{goal}}\n\n📌 **Что нужно сделать:**\n\n{{tasks}}\n\n✅ **Критерии готовности:**\n\n{{acceptance_criteria}}\n\n📊 **Метрики для отслеживания:**\n\n{{metrics}}\n\n🏷️ **Приоритет:** {{priority}}\n\n👥 **Исполнитель:** {{assignee}}"
          }
        },
        "Backend": {
          name: "Backend",
          priority: "Medium",
          labels: ["backend", "development"],
          assignee_rule: "backend-team",
          template: {
            title: "[Backend] {{task_summary}}",
            description: "🎯 **Цель:** {{goal}}\n\n📌 **Что нужно сделать:**\n\n{{tasks}}\n\n✅ **Критерии готовности:**\n\n{{acceptance_criteria}}\n\n🔧 **Технические требования:**\n\n{{technical_requirements}}\n\n🏷️ **Приоритет:** {{priority}}\n\n👥 **Исполнитель:** {{assignee}}"
          }
        },
        "Frontend": {
          name: "Frontend",
          priority: "Medium",
          labels: ["frontend", "ui", "ux"],
          assignee_rule: "frontend-team",
          template: {
            title: "[Frontend] {{task_summary}}",
            description: "🎯 **Цель:** {{goal}}\n\n📌 **Что нужно сделать:**\n\n{{tasks}}\n\n✅ **Критерии готовности:**\n\n{{acceptance_criteria}}\n\n🎨 **UI/UX требования:**\n\n{{ui_requirements}}\n\n🏷️ **Приоритет:** {{priority}}\n\n👥 **Исполнитель:** {{assignee}}"
          }
        },
        "Инфраструктура": {
          name: "Инфраструктура",
          priority: "High",
          labels: ["infrastructure", "system"],
          assignee_rule: "infrastructure-team",
          template: {
            title: "[Инфраструктура] {{task_summary}}",
            description: "🎯 **Цель:** {{goal}}\n\n📌 **Что нужно сделать:**\n\n{{tasks}}\n\n✅ **Критерии готовности:**\n\n{{acceptance_criteria}}\n\n🛠️ **Инфраструктурные требования:**\n\n{{infrastructure_requirements}}\n\n🏷️ **Приоритет:** {{priority}}\n\n👥 **Исполнитель:** {{assignee}}"
          }
        }
      },
      default_assignees: {
        "devops-team": "user@example.com",
        "analytics-team": "user@example.com",
        "backend-team": "user@example.com",
        "infrastructure-team": "user@example.com",
        "frontend-team": "user@example.com"
      }
    };
  }

  /**
   * Получает исполнителя по умолчанию для категории
   * @param {string} category - Категория
   * @returns {Promise<string>} Email исполнителя
   */
  async getDefaultAssignee(category) {
    try {
      const templates = await this.getAllTemplates();
      return templates.default_assignees[category] || templates.default_assignees['backend-team'];
    } catch (error) {
      console.error('Error getting default assignee:', error);
      return 'user@example.com';
    }
  }

  /**
   * Обновляет исполнителей по умолчанию
   * @param {Object} assignees - Новые исполнители
   * @returns {Promise<void>}
   */
  async updateDefaultAssignees(assignees) {
    try {
      const templates = await this.getAllTemplates();
      templates.default_assignees = { ...templates.default_assignees, ...assignees };
      await storage.set(this.storageKey, templates);
    } catch (error) {
      console.error('Error updating default assignees:', error);
      throw new Error(`Не удалось обновить исполнителей по умолчанию: ${error.message}`);
    }
  }
}
