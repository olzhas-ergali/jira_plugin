import api, { storage } from '@forge/api';

export class TaskService {
  constructor() {
    this.jiraApi = api.asApp();
  }

  /**
   * Получает детальную информацию о задаче
   * @param {string} issueKey - Ключ задачи
   * @returns {Promise<Object>} Информация о задаче
   */
  async getIssueDetails(issueKey) {
    try {
      const response = await this.jiraApi.requestJira(route`/rest/api/3/issue/${issueKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const issue = await response.json();
      
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
        }
      };
    } catch (error) {
      console.error('Error getting issue details:', error);
      throw new Error(`Не удалось получить информацию о задаче ${issueKey}: ${error.message}`);
    }
  }

  /**
   * Создает новую задачу
   * @param {Object} issueData - Данные задачи
   * @returns {Promise<Object>} Созданная задача
   */
  async createIssue(issueData) {
    try {
      const response = await this.jiraApi.requestJira(route`/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: issueData
        })
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        key: result.key,
        id: result.id,
        url: `${process.env.JIRA_BASE_URL}/browse/${result.key}`
      };
    } catch (error) {
      console.error('Error creating issue:', error);
      throw new Error(`Не удалось создать задачу: ${error.message}`);
    }
  }

  /**
   * Обновляет существующую задачу
   * @param {string} issueKey - Ключ задачи
   * @param {Object} updateData - Данные для обновления
   * @returns {Promise<Object>} Результат обновления
   */
  async updateIssue(issueKey, updateData) {
    try {
      const response = await this.jiraApi.requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: updateData
        })
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating issue:', error);
      throw new Error(`Не удалось обновить задачу ${issueKey}: ${error.message}`);
    }
  }

  /**
   * Получает информацию о проекте
   * @param {string} projectKey - Ключ проекта
   * @returns {Promise<Object>} Информация о проекте
   */
  async getProjectInfo(projectKey) {
    try {
      const response = await this.jiraApi.requestJira(route`/rest/api/3/project/${projectKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const project = await response.json();
      
      return {
        key: project.key,
        name: project.name,
        description: project.description,
        lead: project.lead.displayName,
        issueTypes: project.issueTypes.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description
        }))
      };
    } catch (error) {
      console.error('Error getting project info:', error);
      throw new Error(`Не удалось получить информацию о проекте ${projectKey}: ${error.message}`);
    }
  }

  /**
   * Получает доступные типы задач для проекта
   * @param {string} projectKey - Ключ проекта
   * @returns {Promise<Array>} Список типов задач
   */
  async getIssueTypes(projectKey) {
    try {
      const projectInfo = await this.getProjectInfo(projectKey);
      return projectInfo.issueTypes;
    } catch (error) {
      console.error('Error getting issue types:', error);
      throw new Error(`Не удалось получить типы задач для проекта ${projectKey}: ${error.message}`);
    }
  }

  /**
   * Получает пользователей проекта
   * @param {string} projectKey - Ключ проекта
   * @returns {Promise<Array>} Список пользователей
   */
  async getProjectUsers(projectKey) {
    try {
      const response = await this.jiraApi.requestJira(route`/rest/api/3/user/assignable/search?project=${projectKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const users = await response.json();
      
      return users.map(user => ({
        accountId: user.accountId,
        displayName: user.displayName,
        emailAddress: user.emailAddress
      }));
    } catch (error) {
      console.error('Error getting project users:', error);
      throw new Error(`Не удалось получить пользователей проекта ${projectKey}: ${error.message}`);
    }
  }
}
