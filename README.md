# Jira OpenAI Automation Service

Автоматизированный сервис для создания задач в Jira с использованием OpenAI для генерации описаний и технических заданий.

## 🚀 Возможности

- **Автоматическая генерация задач** с помощью OpenAI GPT
- **Шаблоны для разных категорий** (DevOps, Аналитика, Backend, Frontend, Инфраструктура)
- **Интеграция с Jira REST API** для создания задач
- **Умное назначение исполнителей** по категориям
- **Автоматическое определение приоритетов** и меток
- **🆕 Работа с Jira URL** - анализ, создание и клонирование задач
- **🆕 Парсинг существующих задач** для создания новых
- **🆕 Клонирование задач** между проектами
- **Rate limiting** для защиты от злоупотреблений
- **Подробное логирование** и обработка ошибок

## 📋 Требования

- Node.js 16+ 
- Jira Cloud аккаунт с API токеном
- OpenAI API ключ
- npm или yarn

## 🛠 Установка

### 🌐 Браузерный плагин (Рекомендуется)

**Самый простой способ использования - через веб-интерфейс!**

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка окружения
cp simple-env.example .env
# Добавьте ваш OpenAI API ключ в .env

# 3. Запуск браузерного плагина
./start-browser-plugin.sh
# Или вручную: npm run simple-dev

# 4. Откройте браузер: http://localhost:3000
```

### 🔧 Полная версия (с Jira API)

```bash
# 1. Установка зависимостей
npm install

### 2. Настройка переменных окружения

Скопируйте файл `env.example` в `.env` и заполните необходимые параметры:

```bash
cp env.example .env
```

Отредактируйте `.env` файл:

```env
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJ
JIRA_ISSUE_TYPE=Task

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Получение API токенов

#### Jira API Token
1. Перейдите в [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Нажмите "Create API token"
3. Дайте токену имя и скопируйте его

#### OpenAI API Key
1. Перейдите в [OpenAI Platform](https://platform.openai.com/api-keys)
2. Создайте новый API ключ
3. Скопируйте ключ

### 4. Запуск сервиса

```bash
# Режим разработки
npm run dev

# Продакшн режим
npm start
```

Сервис будет доступен по адресу: `http://localhost:3000`

## 📚 API Документация

### Основные эндпоинты

#### `POST /api/create-task`
Создает новую задачу в Jira с помощью OpenAI

**Тело запроса:**
```json
{
  "description": "Нужно настроить мониторинг сервера",
  "category": "DevOps",
  "assignee": "devops@company.com" // опционально
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Задача успешно создана",
  "data": {
    "issueKey": "PROJ-123",
    "issueUrl": "https://your-domain.atlassian.net/browse/PROJ-123",
    "title": "[DevOps] Настройка мониторинга сервера",
    "category": "DevOps",
    "priority": "Medium",
    "labels": ["devops", "monitoring"],
    "assignee": "devops@company.com"
  }
}
```

#### `GET /api/categories`
Получает доступные категории задач

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "key": "DevOps",
      "name": "DevOps",
      "priority": "Medium",
      "labels": ["devops", "infrastructure"]
    }
  ]
}
```

#### `GET /api/health`
Проверяет статус подключений к внешним сервисам

**Ответ:**
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "jira": true,
    "openai": true
  }
}
```

#### `GET /api/project-info`
Получает информацию о проекте Jira

**Ответ:**
```json
{
  "success": true,
  "data": {
    "project": {
      "key": "PROJ",
      "name": "My Project",
      "description": "Project description"
    },
    "issueTypes": [
      {
        "id": "10001",
        "name": "Task",
        "description": "A task that needs to be done"
      }
    ]
  }
}
```

### 🆕 Jira URL Functions

#### `POST /api/jira/analyze-url`
Анализирует Jira URL и извлекает информацию

**Тело запроса:**
```json
{
  "url": "https://jira.bi.group/secure/RapidBoard.jspa?rapidView=413&projectKey=BSCT&view=detail&selectedIssue=BSCT-4459#"
}
```

#### `POST /api/jira/create-from-url`
Создает задачу на основе существующей задачи в Jira

**Тело запроса:**
```json
{
  "url": "https://jira.bi.group/secure/RapidBoard.jspa?rapidView=413&projectKey=BSCT&view=detail&selectedIssue=BSCT-4459#",
  "assignee": "developer@company.com",
  "useAI": true
}
```

#### `POST /api/jira/clone-task`
Клонирует задачу в другой проект

**Тело запроса:**
```json
{
  "sourceUrl": "https://jira.bi.group/secure/RapidBoard.jspa?rapidView=413&projectKey=BSCT&view=detail&selectedIssue=BSCT-4459#",
  "targetProject": "NEWPROJ",
  "assignee": "new-developer@company.com"
}
```

#### `GET /api/jira/issue/:issueKey`
Получает информацию о задаче по ключу

#### `GET /api/jira/project/:projectKey`
Получает информацию о проекте по ключу

## 🎯 Категории задач

### DevOps
- **Приоритет:** Medium
- **Метки:** devops, infrastructure
- **Исполнитель:** devops-team

### Аналитика
- **Приоритет:** High
- **Метки:** analytics, data
- **Исполнитель:** analytics-team

### Backend
- **Приоритет:** Medium
- **Метки:** backend, development
- **Исполнитель:** backend-team

### Frontend
- **Приоритет:** Medium
- **Метки:** frontend, ui, ux
- **Исполнитель:** frontend-team

### Инфраструктура
- **Приоритет:** High
- **Метки:** infrastructure, system
- **Исполнитель:** infrastructure-team

## 🔧 Настройка шаблонов

Шаблоны задач настраиваются в файле `src/config/templates.json`. Вы можете:

- Добавить новые категории
- Изменить приоритеты и метки
- Настроить правила назначения исполнителей
- Изменить формат описаний

## 🚦 Rate Limiting

Сервис включает защиту от злоупотреблений:

- **Создание задач:** 10 запросов в 15 минут
- **Общие запросы:** 100 запросов в 15 минут

## 📝 Логирование

Сервис ведет подробные логи:

- Входящие запросы с IP и временем
- Исходящие ответы со статусом и временем выполнения
- Ошибки с детальной информацией
- Успешные операции

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Проверка здоровья сервиса
curl http://localhost:3000/api/health

# Получение категорий
curl http://localhost:3000/api/categories

# Создание тестовой задачи
curl -X POST http://localhost:3000/api/create-task \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Настроить CI/CD пайплайн для проекта",
    "category": "DevOps"
  }'

# 🆕 Анализ Jira URL
curl -X POST http://localhost:3000/api/jira/analyze-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jira.bi.group/secure/RapidBoard.jspa?rapidView=413&projectKey=BSCT&view=detail&selectedIssue=BSCT-4459#"
  }'

# 🆕 Создание задачи из URL
curl -X POST http://localhost:3000/api/jira/create-from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jira.bi.group/secure/RapidBoard.jspa?rapidView=413&projectKey=BSCT&view=detail&selectedIssue=BSCT-4459#",
    "assignee": "developer@company.com",
    "useAI": true
  }'

# 🆕 Клонирование задачи
curl -X POST http://localhost:3000/api/jira/clone-task \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://jira.bi.group/secure/RapidBoard.jspa?rapidView=413&projectKey=BSCT&view=detail&selectedIssue=BSCT-4459#",
    "targetProject": "NEWPROJ",
    "assignee": "new-developer@company.com"
  }'
```

## 🔒 Безопасность

- **Helmet.js** для базовой защиты HTTP заголовков
- **CORS** настройки для кросс-доменных запросов
- **Rate limiting** для защиты от DDoS
- **Валидация входных данных** с Joi
- **Обработка ошибок** без утечки чувствительной информации

## 🐛 Отладка

### Проверка подключений

```bash
# Проверка Jira
curl -u "your-email@example.com:your-api-token" \
  "https://your-domain.atlassian.net/rest/api/3/myself"

# Проверка OpenAI
curl -H "Authorization: Bearer your-openai-key" \
  "https://api.openai.com/v1/models"
```

### Логи

```bash
# Просмотр логов в реальном времени
npm run dev

# Или с PM2
pm2 logs jira-automation
```

## 📦 Развертывание

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2

```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start src/app.js --name jira-automation

# Мониторинг
pm2 monit
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте [Issues](https://github.com/your-repo/issues)
2. Убедитесь, что все переменные окружения настроены
3. Проверьте логи сервиса
4. Создайте новый Issue с подробным описанием

---

**Создано с ❤️ для автоматизации работы с Jira**
# jira_plugin
