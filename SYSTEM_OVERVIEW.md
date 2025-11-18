# System Overview - Demo Ready

## Краткое описание

**Jira Task Generator** - Chrome Extension, который использует AI (OpenAI GPT-3.5) для автоматической генерации структурированных задач в Jira.

---

## Компоненты системы

### 1. Chrome Extension (v1.0.0)
**Статус:** ✅ Готово к демо

**Файлы:**
- `background.js` (228 строк) - Service Worker
- `content.js` (517 строк) - Page Analyzer & Form Injector  
- `popup.js` (634 строки) - UI Logic
- `popup.html` - User Interface
- `popup.css` - Styles

**Функции:**
- ✅ Генерация задач через OpenAI
- ✅ Предпросмотр с редактированием
- ✅ Автоматическое заполнение формы в Jira
- ✅ Анализ страницы Jira
- ✅ Полный анализ проекта (требует Backend)

**Требования:**
- Chrome 88+
- OpenAI API Key

### 2. Backend API (v1.1.0)
**Статус:** ⚠️ Опционален (нужен только для анализа проектов)

**Технологии:**
- Node.js + Express.js
- OpenAI API Integration
- Jira REST API Integration

**Endpoints:**
- `POST /api/project/full-analysis` - Анализ проекта
- `POST /api/create-task` - Создание задачи (опционально)
- `GET /api/health` - Health check

**Требования:**
- Node.js 16+
- Jira API Token
- OpenAI API Key

---

## Как работает система

### Основной Flow (без Backend)

```
User Input → Extension → OpenAI API → Preview → Edit → Jira Form
```

1. Пользователь вводит описание задачи
2. Extension отправляет запрос в OpenAI (GPT-3.5-turbo)
3. AI генерирует структурированную задачу:
   - Title
   - Description (с секциями)
   - Labels
   - Priority
4. Показывается Preview с возможностью редактирования
5. При нажатии "Create in Jira" автоматически заполняется форма
6. Пользователь проверяет и создает задачу

### Расширенный Flow (с Backend)

```
Jira Page → Extension → Content Script → Backend → Jira API → Analysis
```

1. Extension сканирует страницу проекта
2. Собирает все Issue Keys
3. Отправляет в Backend для анализа
4. Backend загружает данные через Jira API
5. Анализирует категории, метки, термины
6. Возвращает статистику в Extension

---

## Технические характеристики

### OpenAI Integration
- **Модель:** gpt-3.5-turbo
- **Max Tokens:** 1000
- **Temperature:** 0.7
- **Формат:** Структурированный ответ

### Jira Integration
- **API:** REST API v3
- **Auth:** Basic (username + API token)
- **Поддержка:** Cloud & Server

### Безопасность
- API ключи в `chrome.storage.sync`
- Rate limiting
- CORS protection
- Helmet.js security

---

## Статистика кода

- **Extension:** ~1,634 строк кода
- **Backend:** ~2,000+ строк кода
- **Всего:** ~3,600+ строк

---

## Демо сценарии

### Сценарий 1: Быстрая генерация (30 сек)
1. Extension → Generate
2. Ввести описание
3. Generate Preview
4. Create in Jira

### Сценарий 2: С редактированием (1 мин)
1. Сгенерировать задачу
2. Нажать "Edit"
3. Изменить поля
4. Create in Jira

### Сценарий 3: Анализ проекта (2 мин, требует Backend)
1. Открыть проект в Jira
2. Extension → Analysis → Full Analysis
3. Показать статистику

---

## Что работает БЕЗ Backend

✅ Генерация задач  
✅ Предпросмотр  
✅ Редактирование  
✅ Создание в Jira  
✅ Быстрый анализ страницы  

## Что требует Backend

⚠️ Полный анализ проекта  
⚠️ Статистика по категориям  
⚠️ Анализ меток и терминов  

---

## Быстрый старт

### Минимальная установка (2 минуты)
1. Установить Extension
2. Ввести OpenAI Key
3. Готово!

### Полная установка (5 минут)
1. Установить Extension
2. Запустить Backend
3. Настроить .env
4. Готово!

---

## Версии

| Компонент | Версия | Статус |
|-----------|--------|--------|
| Chrome Extension | 1.0.0 | ✅ Ready |
| Backend API | 1.1.0 | ✅ Ready |
| Forge Plugin | - | ⚠️ Optional |

---

## Документация

- `README.md` - Основная информация
- `DEMO.md` - Полная документация
- `QUICK_START.md` - Быстрый старт
- `SYSTEM_OVERVIEW.md` - Этот файл

---

**Система готова к демо!**

