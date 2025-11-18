# Jira Task Generator

AI-powered Chrome Extension для автоматической генерации задач в Jira.

## Версии

- **Chrome Extension:** 1.0.0 (Manifest V3)
- **Backend API:** 1.1.0 (Node.js/Express)
- **OpenAI Model:** gpt-3.5-turbo

## Быстрая установка

### Extension
1. `chrome://extensions/` → Developer mode → Load unpacked → `chrome-extension/`
2. Extension → Settings → Ввести OpenAI API Key

### Backend (опционально)
```bash
npm install
cp env.example .env
# Заполнить .env
npm run dev
```

## Использование

1. Открыть Extension popup
2. Ввести описание задачи
3. Generate Task Preview
4. Просмотреть и отредактировать
5. Create in Jira

## Документация

- `DEMO.md` - Полная документация системы
- `QUICK_START.md` - Быстрый старт для демо

## Технологии

- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **AI:** OpenAI GPT-3.5-turbo
- **Integration:** Jira REST API

