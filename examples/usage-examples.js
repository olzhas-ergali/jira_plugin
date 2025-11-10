/**
 * Примеры использования Jira OpenAI Automation Service
 * 
 * Этот файл содержит примеры кода для интеграции с сервисом
 */

const axios = require('axios');

// Конфигурация
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Пример 1: Создание DevOps задачи
 */
async function createDevOpsTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/create-task`, {
      description: "Настроить мониторинг серверов с помощью Prometheus и Grafana, включая алерты и дашборды",
      category: "DevOps"
    });
    
    console.log('✅ DevOps задача создана:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания DevOps задачи:', error.response?.data || error.message);
  }
}

/**
 * Пример 2: Создание аналитической задачи
 */
async function createAnalyticsTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/create-task`, {
      description: "Создать дашборд для отслеживания конверсии пользователей и ключевых метрик продукта",
      category: "Аналитика",
      assignee: "user@example.com"
    });
    
    console.log('✅ Аналитическая задача создана:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания аналитической задачи:', error.response?.data || error.message);
  }
}

/**
 * Пример 3: Создание Backend задачи
 */
async function createBackendTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/create-task`, {
      description: "Реализовать REST API для управления пользователями с JWT аутентификацией и ролевой моделью",
      category: "Backend"
    });
    
    console.log('✅ Backend задача создана:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания Backend задачи:', error.response?.data || error.message);
  }
}

/**
 * Пример 4: Создание Frontend задачи
 */
async function createFrontendTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/create-task`, {
      description: "Создать адаптивный интерфейс для мобильного приложения с поддержкой темной темы",
      category: "Frontend"
    });
    
    console.log('✅ Frontend задача создана:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания Frontend задачи:', error.response?.data || error.message);
  }
}

/**
 * Пример 5: Создание задачи инфраструктуры
 */
async function createInfrastructureTask() {
  try {
    const response = await axios.post(`${API_BASE_URL}/create-task`, {
      description: "Настроить Kubernetes кластер для продакшн окружения с автоматическим масштабированием",
      category: "Инфраструктура"
    });
    
    console.log('✅ Задача инфраструктуры создана:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания задачи инфраструктуры:', error.response?.data || error.message);
  }
}

/**
 * Пример 6: Получение доступных категорий
 */
async function getCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    console.log('📋 Доступные категории:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка получения категорий:', error.response?.data || error.message);
  }
}

/**
 * Пример 7: Проверка здоровья сервиса
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('🏥 Статус сервиса:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка проверки здоровья:', error.response?.data || error.message);
  }
}

/**
 * Пример 8: Получение информации о проекте
 */
async function getProjectInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/project-info`);
    console.log('📊 Информация о проекте:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка получения информации о проекте:', error.response?.data || error.message);
  }
}

/**
 * Пример 9: Массовое создание задач
 */
async function createMultipleTasks() {
  const tasks = [
    {
      description: "Настроить CI/CD пайплайн для автоматического деплоя",
      category: "DevOps"
    },
    {
      description: "Создать систему логирования и мониторинга ошибок",
      category: "Backend"
    },
    {
      description: "Оптимизировать производительность базы данных",
      category: "Backend"
    },
    {
      description: "Создать мобильное приложение для iOS и Android",
      category: "Frontend"
    },
    {
      description: "Настроить резервное копирование и восстановление данных",
      category: "Инфраструктура"
    }
  ];

  const results = [];
  
  for (const task of tasks) {
    try {
      console.log(`🔄 Создание задачи: ${task.description}`);
      const response = await axios.post(`${API_BASE_URL}/create-task`, task);
      results.push({ success: true, data: response.data });
      console.log(`✅ Задача создана: ${response.data.data.issueKey}`);
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Ошибка создания задачи: ${task.description}`, error.response?.data || error.message);
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Пример 10: Обработка ошибок
 */
async function handleErrors() {
  try {
    // Попытка создать задачу с неверной категорией
    await axios.post(`${API_BASE_URL}/create-task`, {
      description: "Тестовая задача",
      category: "InvalidCategory"
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️ Ошибка валидации:', error.response.data.details);
    } else {
      console.error('❌ Неожиданная ошибка:', error.message);
    }
  }
}

// Экспорт функций для использования в других модулях
module.exports = {
  createDevOpsTask,
  createAnalyticsTask,
  createBackendTask,
  createFrontendTask,
  createInfrastructureTask,
  getCategories,
  checkHealth,
  getProjectInfo,
  createMultipleTasks,
  handleErrors
};

// Если файл запускается напрямую, выполняем примеры
if (require.main === module) {
  async function runExamples() {
    console.log('🚀 Запуск примеров использования...\n');
    
    // Проверяем здоровье сервиса
    await checkHealth();
    console.log('');
    
    // Получаем категории
    await getCategories();
    console.log('');
    
    // Создаем задачи по категориям
    await createDevOpsTask();
    console.log('');
    
    await createAnalyticsTask();
    console.log('');
    
    await createBackendTask();
    console.log('');
    
    await createFrontendTask();
    console.log('');
    
    await createInfrastructureTask();
    console.log('');
    
    // Демонстрируем обработку ошибок
    await handleErrors();
    console.log('');
    
    console.log('✅ Все примеры выполнены!');
  }
  
  runExamples().catch(console.error);
}
