# Руководство по публикации проекта

## Платформы для публикации

### 1. Chrome Web Store (Основная платформа)

**URL:** https://chrome.google.com/webstore/devconsole

**Требования:**
- Аккаунт разработчика ($5 единоразово)
- ZIP архив расширения (макс. 10MB)
- Скриншоты (минимум 1, рекомендуется 5)
- Описание (минимум 132 символа)
- Privacy Policy (обязательно)
- Иконки (16x16, 48x48, 128x128) ✅ Уже есть

**Что нужно подготовить:**

1. **Скриншоты:**
   - Главный экран popup
   - Процесс генерации задачи
   - Предпросмотр задачи
   - Анализ проекта
   - Settings страница

2. **Описание для Store:**
```
Jira Task Generator - AI-powered Chrome Extension for automatic Jira task creation.

Features:
- Generate structured Jira tasks using OpenAI GPT-3.5
- Preview and edit tasks before creation
- Auto-fill Jira forms
- Project analysis and statistics
- Clean, minimal interface

Perfect for teams who want to speed up task creation in Jira with AI assistance.
```

3. **Privacy Policy:**
   - Создать страницу с политикой конфиденциальности
   - Указать что данные хранятся локально
   - OpenAI API ключи хранятся в chrome.storage.sync
   - Нет сбора персональных данных

4. **ZIP архив:**
```bash
cd chrome-extension
zip -r ../jira-task-generator-v1.0.0.zip . -x "*.DS_Store" "*.git*"
```

**Важно:** Убрать `http://localhost:3000/*` из host_permissions перед публикацией!

---

### 2. GitHub (Исходный код)

**URL:** https://github.com/new

**Рекомендации:**

1. **Создать репозиторий:**
   - Название: `jira-task-generator`
   - Описание: "AI-powered Chrome Extension for automatic Jira task creation"
   - Public или Private
   - Добавить README.md ✅
   - Добавить LICENSE ✅

2. **Файлы для .gitignore:**
```
node_modules/
.env
*.log
.DS_Store
dist/
build/
*.zip
```

3. **Структура репозитория:**
```
jira-task-generator/
├── chrome-extension/     # Extension код
├── src/                  # Backend API
├── docs/                 # Документация
├── README.md
├── LICENSE
└── package.json
```

4. **GitHub Pages (опционально):**
   - Можно создать landing page
   - Документация
   - Инструкции по установке

---

### 3. Firefox Add-ons (Альтернатива)

**URL:** https://addons.mozilla.org/developers/

**Требования:**
- Адаптировать manifest.json для Firefox
- Manifest V3 поддерживается
- Бесплатно

**Изменения:**
- Заменить `chrome.*` на `browser.*` (или использовать polyfill)
- Проверить permissions

---

### 4. Edge Add-ons

**URL:** https://partner.microsoft.com/dashboard/microsoftedge/overview

**Требования:**
- Аналогично Chrome Web Store
- Manifest V3
- Бесплатно

---

### 5. Atlassian Marketplace (Для Jira интеграции)

**URL:** https://developer.atlassian.com/marketplace/

**Требования:**
- Forge App или Connect App
- Более сложная интеграция
- Требуется сертификация

**Статус:** У вас есть `forge-plugin/` - можно развить

---

## Пошаговая инструкция для Chrome Web Store

### Шаг 1: Подготовка файлов

```bash
# 1. Убрать localhost из manifest.json
# 2. Создать ZIP
cd chrome-extension
zip -r ../jira-task-generator.zip . -x "*.DS_Store"
```

### Шаг 2: Создать Privacy Policy

Создать файл `PRIVACY_POLICY.md`:

```markdown
# Privacy Policy

Jira Task Generator respects your privacy.

## Data Storage
- OpenAI API keys are stored locally in chrome.storage.sync
- No data is sent to third-party servers except OpenAI API
- All processing happens in your browser

## Data Collection
- We do not collect any personal information
- We do not track user behavior
- We do not use analytics

## Third-party Services
- OpenAI API: Used for task generation (user's API key)
- Jira: User's own Jira instance

## Contact
For questions: [your-email]
```

Опубликовать на GitHub Pages или создать отдельную страницу.

### Шаг 3: Подготовить скриншоты

Нужно 1-5 скриншотов (1280x800 или 640x400):
1. Главный экран popup
2. Процесс генерации
3. Предпросмотр задачи
4. Анализ проекта
5. Settings

### Шаг 4: Заполнить форму в Chrome Web Store

1. Зайти на https://chrome.google.com/webstore/devconsole
2. Оплатить $5 (единоразово)
3. "New Item" → Загрузить ZIP
4. Заполнить:
   - Название: "Jira Task Generator"
   - Описание: (см. выше)
   - Категория: Productivity
   - Язык: English
   - Privacy Policy URL
   - Скриншоты
   - Иконки ✅

### Шаг 5: Отправить на проверку

- Обычно 1-3 дня
- Могут запросить изменения
- После одобрения - публикация

---

## Рекомендации перед публикацией

### Обязательно исправить:

1. **manifest.json:**
   - Убрать `"http://localhost:3000/*"` из host_permissions
   - Добавить `"homepage_url"` (если есть сайт)
   - Добавить `"update_url"` (для автообновлений)

2. **Privacy Policy:**
   - Создать и опубликовать
   - Указать в Store

3. **Описание:**
   - Английский язык (для большей аудитории)
   - Четкое описание функций
   - Скриншоты

4. **Версия:**
   - Убедиться что версия в manifest.json актуальна
   - При обновлениях увеличивать версию

### Опционально:

1. **Создать сайт:**
   - Landing page
   - Документация
   - GitHub Pages или отдельный домен

2. **Добавить analytics (опционально):**
   - Только с согласия пользователя
   - Для понимания использования

3. **Поддержка:**
   - Email для обратной связи
   - GitHub Issues
   - Документация

---

## Быстрый чеклист перед публикацией

- [ ] Убрать localhost из manifest.json
- [ ] Создать ZIP архив
- [ ] Подготовить скриншоты (минимум 1)
- [ ] Написать описание (минимум 132 символа)
- [ ] Создать Privacy Policy
- [ ] Проверить все функции
- [ ] Протестировать на чистом Chrome
- [ ] Обновить версию в manifest.json
- [ ] Проверить иконки (16, 48, 128)
- [ ] Оплатить $5 за аккаунт разработчика

---

## Альтернативные варианты распространения

### 1. GitHub Releases
- Бесплатно
- Для технических пользователей
- Можно распространять .crx файл

### 2. Собственный сайт
- Полный контроль
- Можно продавать
- Требуется хостинг

### 3. Прямая установка
- Для корпоративных клиентов
- Установка через групповые политики
- Без публикации в Store

---

## Полезные ссылки

- Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Chrome Extension Documentation: https://developer.chrome.com/docs/extensions/
- Manifest V3 Guide: https://developer.chrome.com/docs/extensions/mv3/intro/
- Privacy Policy Generator: https://www.freeprivacypolicy.com/

---

**Готово к публикации!**

