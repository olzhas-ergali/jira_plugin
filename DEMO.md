# Jira Task Generator - Demo Documentation

## Система

**Jira Task Generator** - AI-powered расширение для Chrome, которое автоматически генерирует задачи в Jira с использованием OpenAI GPT.

---

## Версии компонентов

### Chrome Extension
- **Версия:** 1.0.0
- **Manifest:** V3
- **Технологии:** Vanilla JavaScript, HTML5, CSS3
- **Файлы:**
  - `manifest.json` - конфигурация расширения
  - `background.js` - service worker (228 строк)
  - `content.js` - скрипт для работы с Jira страницами (517 строк)
  - `popup.js` - логика popup интерфейса (634 строки)
  - `popup.html` - UI интерфейс
  - `popup.css` - стили

### Backend API
- **Версия:** 1.1.0
- **Технологии:** Node.js, Express.js
- **Порт:** 3000 (по умолчанию)
- **Основной файл:** `src/app.js`
- **Зависимости:**
  - express: ^4.18.2
  - axios: ^1.6.0
  - openai: ^4.26.0
  - joi: ^17.11.0

### Forge Plugin (опционально)
- **Runtime:** Node.js 18.x
- **Тип:** Atlassian Forge App
- **Статус:** Дополнительный компонент

---

## Архитектура системы

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  popup.js    │  │ background.js│  │ content.js   │   │
│  │  (UI Logic)  │  │ (Service     │  │ (Page       │   │
│  │              │  │  Worker)     │  │  Analyzer)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend API Server                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  app.js      │  │ Controllers  │  │  Services    │   │
│  │  (Express)   │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        │ API Calls
                        ▼
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  ┌──────────────┐              ┌──────────────┐         │
│  │  OpenAI API  │              │  Jira API    │         │
│  │  (GPT-3.5)   │              │  (REST)      │         │
│  └──────────────┘              └──────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## Как работает система

### 1. Генерация задачи (основной flow)

```
Пользователь → Extension Popup
    ↓
Вводит описание задачи
    ↓
Нажимает "Generate Task Preview"
    ↓
Extension → OpenAI API (GPT-3.5-turbo)
    ↓
AI генерирует:
  - Title (заголовок)
  - Description (описание с секциями)
  - Labels (метки)
  - Priority (приоритет)
    ↓
Показывается Preview с возможностью редактирования
    ↓
Пользователь нажимает "Create in Jira"
    ↓
Extension → Content Script → Jira Page
    ↓
Автоматическое заполнение формы создания задачи
    ↓
Пользователь проверяет и нажимает "Create" в Jira
```

### 2. Анализ проекта (опциональный flow)

```
Пользователь на Jira странице проекта
    ↓
Extension → Content Script
    ↓
Сканирование всех задач проекта
    ↓
Сбор Issue Keys
    ↓
POST → Backend API (/api/project/full-analysis)
    ↓
Backend → Jira API (загрузка данных задач)
    ↓
Анализ:
  - Категории задач
  - Топ метки
  - Общие термины
  - Лучшие примеры
    ↓
Возврат анализа в Extension
    ↓
Показ статистики и рекомендаций
```

---

## Компоненты системы

### Chrome Extension

#### background.js
- **Роль:** Service Worker для фоновых операций
- **Функции:**
  - Обработка сообщений между компонентами
  - Управление context menu
  - Интеграция с OpenAI API (резервный вариант)

#### content.js
- **Роль:** Скрипт, работающий на страницах Jira
- **Функции:**
  - Анализ страницы Jira
  - Сканирование задач проекта
  - Извлечение Issue Keys
  - Заполнение формы создания задачи
  - Отправка данных в Backend

#### popup.js
- **Роль:** Логика пользовательского интерфейса
- **Функции:**
  - Генерация задач через OpenAI
  - Предпросмотр и редактирование
  - Управление настройками
  - Копирование данных

### Backend API

#### Основные endpoints:

**POST /api/project/full-analysis**
- Полный анализ проекта
- Вход: `{ projectKey, issueKeys }`
- Выход: статистика, категории, метки, примеры

**POST /api/create-task**
- Создание задачи через API (опционально)
- Вход: `{ description, category, assignee }`

**GET /api/health**
- Проверка статуса сервиса

---

## Быстрый старт для демо

### 1. Установка Extension

```bash
1. Открыть chrome://extensions/
2. Включить "Developer mode"
3. Нажать "Load unpacked"
4. Выбрать папку chrome-extension/
```

### 2. Настройка Extension

```
1. Кликнуть на иконку расширения
2. Перейти на вкладку "Settings"
3. Ввести OpenAI API Key (sk-...)
4. Нажать "Save Settings"
```

### 3. Запуск Backend (опционально, для анализа проекта)

```bash
cd "jira plugin"
npm install
cp env.example .env
# Заполнить .env файл
npm run dev
```

Backend запустится на `http://localhost:3000`

### 4. Использование

**Генерация задачи:**
1. Открыть Extension popup
2. Вкладка "Generate"
3. Ввести описание задачи
4. Нажать "Generate Task Preview"
5. Просмотреть и отредактировать (опционально)
6. Нажать "Create in Jira"
7. Откроется страница создания задачи в Jira с заполненной формой

**Анализ проекта:**
1. Открыть страницу проекта в Jira
2. Extension popup → вкладка "Analysis"
3. Нажать "Full Project Analysis"
4. Дождаться сканирования и анализа
5. Просмотреть статистику

---

## Технические детали

### OpenAI Integration
- **Модель:** gpt-3.5-turbo
- **Max tokens:** 1000
- **Temperature:** 0.7
- **Формат ответа:** Структурированный (TITLE, DESCRIPTION, LABELS, PRIORITY)

### Jira Integration
- **API:** REST API v3
- **Аутентификация:** Basic Auth (username + API token)
- **Поддержка:** Atlassian Cloud и Jira Server

### Безопасность
- API ключи хранятся в `chrome.storage.sync`
- Rate limiting на Backend
- CORS защита
- Helmet.js для безопасности Express

---

## Требования

### Для Extension:
- Chrome 88+ (Manifest V3)
- OpenAI API Key

### Для Backend:
- Node.js 16+
- Jira API Token
- OpenAI API Key

---

## Структура проекта

```
jira-plugin/
├── chrome-extension/      # Chrome Extension (v1.0.0)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.js/html/css
│   └── icons/
├── src/                   # Backend API (v1.1.0)
│   ├── app.js
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── config/
├── forge-plugin/          # Forge App (опционально)
└── package.json
```

---

## Демо сценарий

### Сценарий 1: Быстрая генерация задачи
1. Открыть Extension
2. Ввести: "Add user authentication with JWT tokens"
3. Generate → Preview → Create in Jira
4. **Время:** ~30 секунд

### Сценарий 2: Анализ проекта
1. Открыть Jira проект
2. Extension → Analysis → Full Project Analysis
3. Показать статистику
4. **Время:** 1-2 минуты (зависит от количества задач)

### Сценарий 3: Редактирование перед созданием
1. Сгенерировать задачу
2. Нажать "Edit"
3. Изменить заголовок или описание
4. Create in Jira
5. **Время:** ~1 минута

---

## Известные ограничения

1. Backend требуется только для полного анализа проекта
2. Генерация задач работает напрямую через Extension → OpenAI
3. Заполнение формы работает только на страницах создания задачи в Jira
4. Требуется активная вкладка с Jira для создания задачи

---

## Поддержка

- **Extension:** Работает автономно (требуется только OpenAI ключ)
- **Backend:** Опционален, нужен для анализа проектов
- **Forge Plugin:** Дополнительный компонент, не обязателен для демо

---

**Версия документа:** 1.0  
**Дата:** 2024  
**Статус:** Готово к демо

