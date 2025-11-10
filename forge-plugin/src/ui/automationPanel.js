import { render } from '@forge/ui';

export const AutomationPanel = () => {
  return render(
    <div style={{ padding: '16px' }}>
      <h2>🤖 Jira OpenAI Automation</h2>
      <p>Автоматическое создание и улучшение задач с помощью AI</p>
      
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="action">Выберите действие:</label>
        <select id="action" style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
          <option value="">-- Выберите действие --</option>
          <option value="enhance">Улучшить существующую задачу</option>
          <option value="create-from-template">Создать задачу из шаблона</option>
          <option value="clone-task">Клонировать задачу</option>
        </select>
      </div>

      <div id="issueKeyGroup" style={{ display: 'none', marginBottom: '16px' }}>
        <label htmlFor="issueKey">Ключ задачи:</label>
        <input 
          type="text" 
          id="issueKey" 
          placeholder="PROJ-123"
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div id="templateGroup" style={{ display: 'none', marginBottom: '16px' }}>
        <label htmlFor="template">Шаблон:</label>
        <select id="template" style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
          <option value="DevOps">DevOps</option>
          <option value="Аналитика">Аналитика</option>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="Инфраструктура">Инфраструктура</option>
        </select>
      </div>

      <div id="descriptionGroup" style={{ display: 'none', marginBottom: '16px' }}>
        <label htmlFor="description">Описание задачи:</label>
        <textarea 
          id="description" 
          placeholder="Опишите задачу..."
          style={{ width: '100%', padding: '8px', marginTop: '4px', height: '80px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="projectKey">Проект:</label>
          <input 
            type="text" 
            id="projectKey" 
            placeholder="PROJ"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="issueType">Тип задачи:</label>
          <select id="issueType" style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
            <option value="Task">Task</option>
            <option value="Story">Story</option>
            <option value="Bug">Bug</option>
            <option value="Epic">Epic</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="assignee">Исполнитель (опционально):</label>
        <input 
          type="text" 
          id="assignee" 
          placeholder="user@example.com"
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>
          <input type="checkbox" id="useAI" defaultChecked />
          Использовать AI для генерации контента
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          id="submitBtn" 
          style={{ 
            flex: 1, 
            padding: '12px', 
            backgroundColor: '#0052cc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Выполнить
        </button>
        <button 
          id="resetBtn" 
          style={{ 
            flex: 1, 
            padding: '12px', 
            backgroundColor: '#6b778c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Сбросить
        </button>
      </div>

      <div id="status" style={{ 
        marginTop: '16px', 
        padding: '12px', 
        borderRadius: '4px', 
        display: 'none' 
      }} />
    </div>
  );
};
