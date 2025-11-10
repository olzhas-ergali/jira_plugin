/**
 * Примеры использования Jira URL функций
 * 
 * Этот файл содержит примеры работы с Jira URL для анализа и создания задач
 */

const axios = require('axios');

// Конфигурация
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Пример 1: Анализ Jira URL
 */
async function analyzeJiraUrl() {
  try {
    const response = await axios.post(`${API_BASE_URL}/jira/analyze-url`, {
      url: 'https://your-jira.atlassian.net/browse/PROJ-123'
    });
    
    console.log('✅ Анализ URL выполнен:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка анализа URL:', error.response?.data || error.message);
  }
}

/**
 * Пример 2: Создание задачи из Jira URL
 */
async function createTaskFromUrl() {
  try {
    const response = await axios.post(`${API_BASE_URL}/jira/create-from-url`, {
      url: 'https://your-jira.atlassian.net/browse/PROJ-123',
      assignee: 'user@example.com',
      additionalInfo: 'Дополнительная информация для новой задачи',
      useAI: true
    });
    
    console.log('✅ Задача создана из URL:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания задачи из URL:', error.response?.data || error.message);
  }
}

/**
 * Пример 3: Клонирование задачи
 */
async function cloneTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/jira/clone-task`, {
      sourceUrl: 'https://your-jira.atlassian.net/browse/PROJ-123',
      targetProject: 'NEWPROJ',
      targetIssueType: 'Task',
      assignee: 'user@example.com',
      additionalInfo: 'Клонированная задача с дополнительной информацией'
    });
    
    console.log('✅ Задача клонирована:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка клонирования задачи:', error.response?.data || error.message);
  }
}

/**
 * Пример 4: Получение информации о задаче
 */
async function getIssueInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/jira/issue/PROJ-123`);
    
    console.log('✅ Информация о задаче:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка получения информации о задаче:', error.response?.data || error.message);
  }
}

/**
 * Пример 5: Получение информации о проекте
 */
async function getProjectInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/jira/project/PROJ`);
    
    console.log('✅ Информация о проекте:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка получения информации о проекте:', error.response?.data || error.message);
  }
}

/**
 * Пример 6: Массовое создание задач из URL
 */
async function createMultipleTasksFromUrls() {
  const urls = [
    'https://your-jira.atlassian.net/browse/PROJ-123',
    'https://your-jira.atlassian.net/browse/PROJ-124',
    'https://your-jira.atlassian.net/browse/PROJ-125'
  ];

  const results = [];
  
  for (const url of urls) {
    try {
      console.log(`🔄 Создание задачи из URL: ${url}`);
      const response = await axios.post(`${API_BASE_URL}/jira/create-from-url`, {
        url: url,
        useAI: true
      });
      results.push({ success: true, data: response.data });
      console.log(`✅ Задача создана: ${response.data.data.issueKey}`);
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Ошибка создания задачи из URL: ${url}`, error.response?.data || error.message);
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Пример 7: Анализ и создание задачи с кастомными настройками
 */
async function createTaskWithCustomSettings() {
  try {
    // Сначала анализируем URL
    const analysisResponse = await axios.post(`${API_BASE_URL}/jira/analyze-url`, {
      url: 'https://your-jira.atlassian.net/browse/PROJ-123'
    });
    
    console.log('📊 Анализ URL:', analysisResponse.data);
    
    // Создаем задачу на основе анализа
    const createResponse = await axios.post(`${API_BASE_URL}/jira/create-from-url`, {
      url: 'https://your-jira.atlassian.net/browse/PROJ-123',
      assignee: 'user@example.com',
      additionalInfo: 'Кастомная информация для задачи',
      useAI: false // Используем простой режим без AI
    });
    
    console.log('✅ Задача создана с кастомными настройками:', createResponse.data);
    return createResponse.data;
  } catch (error) {
    console.error('❌ Ошибка создания задачи с кастомными настройками:', error.response?.data || error.message);
  }
}

/**
 * Пример 8: Обработка ошибок
 */
async function handleUrlErrors() {
  try {
    // Попытка анализа неверного URL
    await axios.post(`${API_BASE_URL}/jira/analyze-url`, {
      url: 'https://invalid-jira-url.com/issue/INVALID-123'
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️ Ошибка валидации URL:', error.response.data.details);
    } else if (error.response?.status === 500) {
      console.log('⚠️ Ошибка анализа URL:', error.response.data.message);
    } else {
      console.error('❌ Неожиданная ошибка:', error.message);
    }
  }
}

// Экспорт функций для использования в других модулях
module.exports = {
  analyzeJiraUrl,
  createTaskFromUrl,
  cloneTask,
  getIssueInfo,
  getProjectInfo,
  createMultipleTasksFromUrls,
  createTaskWithCustomSettings,
  handleUrlErrors
};

// Если файл запускается напрямую, выполняем примеры
if (require.main === module) {
  async function runExamples() {
    console.log('🚀 Запуск примеров работы с Jira URL...\n');
    
    // Анализ URL
    await analyzeJiraUrl();
    console.log('');
    
    // Получение информации о задаче
    await getIssueInfo();
    console.log('');
    
    // Получение информации о проекте
    await getProjectInfo();
    console.log('');
    
    // Создание задачи из URL
    await createTaskFromUrl();
    console.log('');
    
    // Клонирование задачи
    await cloneTask();
    console.log('');
    
    // Создание задачи с кастомными настройками
    await createTaskWithCustomSettings();
    console.log('');
    
    // Демонстрируем обработку ошибок
    await handleUrlErrors();
    console.log('');
    
    console.log('✅ Все примеры выполнены!');
  }
  
  runExamples().catch(console.error);
}
