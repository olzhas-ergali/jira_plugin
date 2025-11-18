class JiraOpenAIExtension {
    constructor() {
        console.log('Extension popup initializing...');
        this.init();
    }

    init() {
        console.log('Setting up extension...');
        this.setupTabs();
        this.setupEventListeners();
        this.loadSettings();
        console.log('Extension ready!');
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const fullAnalysisBtn = document.getElementById('fullAnalysisBtn');
        const saveSettingsBtn = document.getElementById('saveSettings');
        const editToggle = document.getElementById('editToggle');
        const regenerateBtn = document.getElementById('regenerateBtn');
        const copyAllBtn = document.getElementById('copyAllBtn');
        const createInJiraBtn = document.getElementById('createInJiraBtn');
        const clearFormBtn = document.getElementById('clearFormBtn');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateTask());
        }

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzePage());
        }

        if (fullAnalysisBtn) {
            fullAnalysisBtn.addEventListener('click', () => this.runFullProjectAnalysis());
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        if (editToggle) {
            editToggle.addEventListener('click', () => this.toggleEditMode());
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateTask());
        }

        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', () => this.copyAllToClipboard());
        }

        if (createInJiraBtn) {
            createInJiraBtn.addEventListener('click', () => this.createTaskInJira());
        }

        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', () => this.clearForm());
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyToClipboard(e.target);
            }
        });
    }

    async generateTask() {
        const descriptionEl = document.getElementById('description');
        const categoryEl = document.getElementById('category');
        const btn = document.getElementById('generateBtn');

        if (!descriptionEl || !btn) {
            this.showStatus('Error: Form elements not found', 'error');
            return;
        }

        const description = descriptionEl.value;
        const category = categoryEl ? categoryEl.value : '';
        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');

        if (!description || !description.trim()) {
            this.showStatus('Enter task description', 'error');
            return;
        }

        if (!btnText || !loading) {
            this.showStatus('Error: Button elements not found', 'error');
            return;
        }

        btn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'inline';

        try {
            const result = await this.callOpenAI(description, category);
            this.displayPreview(result);
            const previewEl = document.getElementById('preview');
            if (previewEl) {
                previewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    async callOpenAI(description, category) {
        const settings = await this.getSettings();
        
        if (!settings.openaiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.buildPrompt(description, category);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in creating Jira tasks. Create high-quality technical specifications.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            let errorMessage = `OpenAI API error: ${response.status}`;
            try {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorData.message || errorMessage;
                } catch (e) {
                    if (response.status === 401) {
                        errorMessage = 'Invalid OpenAI API key. Please check your key in Settings.';
                    } else if (response.status === 429) {
                        errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
                    } else if (response.status >= 500) {
                        errorMessage = 'OpenAI API server error. Please try again later.';
                    }
                }
            } catch (e) {
                if (response.status === 401) {
                    errorMessage = 'Invalid OpenAI API key. Please check your key in Settings.';
                } else if (response.status === 429) {
                    errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
                } else if (response.status >= 500) {
                    errorMessage = 'OpenAI API server error. Please try again later.';
                }
            }
            throw new Error(errorMessage);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid JSON response from OpenAI API');
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response from OpenAI API');
        }
        
        const content = data.choices[0].message.content;
        
        if (!content || content.trim().length === 0) {
            throw new Error('Empty response from OpenAI API');
        }
        
        return this.parseOpenAIResponse(content);
    }

    buildPrompt(description, category) {
        const categoryPart = category ? `Category: ${category}\n\n` : '';
        return `Create a Jira task${category ? ` in category "${category}"` : ''}.

${categoryPart}Description: ${description}

Create:
1. Task title (brief and clear)
2. Detailed description with sections:
   - Goal
   - What needs to be done
   - Acceptance criteria
3. Labels (comma-separated)
4. Priority (High/Medium/Low)

${category ? 'If category is specified, ensure the task aligns with that category.\n' : 'Analyze the description and determine the appropriate category automatically.\n'}

Response format:
TITLE: [title]
DESCRIPTION: [description]
LABELS: [labels]
PRIORITY: [priority]`;
    }

    parseOpenAIResponse(content) {
        const result = {
            title: '',
            description: '',
            labels: '',
            priority: ''
        };

        const titleMatch = content.match(/TITLE:\s*(.+?)(?:\n|$)/i);
        const descMatch = content.match(/DESCRIPTION:\s*([\s\S]+?)(?:LABELS:|PRIORITY:|$)/i);
        const labelsMatch = content.match(/LABELS:\s*(.+?)(?:\n|$)/i);
        const priorityMatch = content.match(/PRIORITY:\s*(.+?)(?:\n|$)/i);

        if (titleMatch) result.title = titleMatch[1].trim();
        if (descMatch) result.description = descMatch[1].trim();
        if (labelsMatch) result.labels = labelsMatch[1].trim();
        if (priorityMatch) result.priority = priorityMatch[1].trim();

        return result;
    }

    displayPreview(result) {
        if (!result) {
            this.showStatus('Error: No data received', 'error');
            return;
        }

        const titleEl = document.getElementById('preview-title');
        const descEl = document.getElementById('preview-description');
        const labelsEl = document.getElementById('preview-labels');
        const priorityEl = document.getElementById('preview-priority');
        const previewEl = document.getElementById('preview');

        if (!titleEl || !descEl || !labelsEl || !priorityEl || !previewEl) {
            this.showStatus('Error: Preview elements not found', 'error');
            return;
        }

        titleEl.value = result.title || '';
        descEl.value = result.description || '';
        labelsEl.value = result.labels || '';
        priorityEl.value = result.priority || 'Medium';
        previewEl.style.display = 'block';
        this.currentPreview = result;
        this.isEditMode = false;
        this.updateEditMode();
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        this.updateEditMode();
    }

    updateEditMode() {
        const titleInput = document.getElementById('preview-title');
        const descInput = document.getElementById('preview-description');
        const labelsInput = document.getElementById('preview-labels');
        const priorityInput = document.getElementById('preview-priority');
        const editToggle = document.getElementById('editToggle');

        if (!titleInput || !descInput || !labelsInput || !priorityInput || !editToggle) {
            return;
        }

        [titleInput, descInput, labelsInput, priorityInput].forEach(input => {
            if (input) {
                input.readOnly = !this.isEditMode;
            }
        });

        editToggle.textContent = this.isEditMode ? 'Lock' : 'Edit';
        editToggle.title = this.isEditMode ? 'Lock editing' : 'Edit task';
    }

    async regenerateTask() {
        const descriptionEl = document.getElementById('description');
        const categoryEl = document.getElementById('category');
        const regenerateBtn = document.getElementById('regenerateBtn');

        if (!descriptionEl || !regenerateBtn) {
            this.showStatus('Error: Form elements not found', 'error');
            return;
        }

        const description = descriptionEl.value;
        const category = categoryEl ? categoryEl.value : '';

        if (!description || !description.trim()) {
            this.showStatus('Enter task description first', 'error');
            return;
        }

        regenerateBtn.disabled = true;
        regenerateBtn.textContent = 'Generating...';

        try {
            const result = await this.callOpenAI(description, category);
            this.displayPreview(result);
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            regenerateBtn.disabled = false;
            regenerateBtn.textContent = 'Regenerate';
        }
    }

    async copyAllToClipboard() {
        const titleEl = document.getElementById('preview-title');
        const descEl = document.getElementById('preview-description');
        const labelsEl = document.getElementById('preview-labels');
        const priorityEl = document.getElementById('preview-priority');
        const copyAllBtn = document.getElementById('copyAllBtn');

        if (!titleEl || !descEl || !labelsEl || !priorityEl || !copyAllBtn) {
            this.showStatus('Error: Preview elements not found', 'error');
            return;
        }

        const title = titleEl.value || '';
        const description = descEl.value || '';
        const labels = labelsEl.value || '';
        const priority = priorityEl.value || '';

        const allText = `Title: ${title}\n\nDescription:\n${description}\n\nLabels: ${labels}\nPriority: ${priority}`;

        try {
            await navigator.clipboard.writeText(allText);
            const originalText = copyAllBtn.textContent;
            copyAllBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyAllBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            this.showStatus('Copy error: ' + error.message, 'error');
        }
    }

    async createTaskInJira() {
        const createBtn = document.getElementById('createInJiraBtn');
        const statusDiv = document.getElementById('createStatus');
        const titleEl = document.getElementById('preview-title');
        const descEl = document.getElementById('preview-description');
        const labelsEl = document.getElementById('preview-labels');
        const priorityEl = document.getElementById('preview-priority');

        if (!createBtn || !statusDiv || !titleEl || !descEl || !labelsEl || !priorityEl) {
            this.showStatus('Error: Required elements not found', 'error');
            return;
        }

        const taskData = {
            title: titleEl.value || '',
            description: descEl.value || '',
            labels: labelsEl.value || '',
            priority: priorityEl.value || ''
        };

        if (!taskData.title.trim()) {
            statusDiv.textContent = 'Error: Title is required';
            statusDiv.className = 'create-status error';
            statusDiv.style.display = 'block';
            return;
        }

        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';
        statusDiv.style.display = 'block';
        statusDiv.className = 'create-status info';
        statusDiv.textContent = 'Opening Jira create page...';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!this.isJiraUrl(tab.url)) {
                throw new Error('Please open a Jira page first');
            }

            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (injectError) {
                console.log('Content script may already be injected');
            }

            statusDiv.textContent = 'Filling form in Jira...';
            
            const result = await chrome.tabs.sendMessage(tab.id, {
                action: 'injectIntoJiraForm',
                data: taskData
            });

            if (result && result.error) {
                throw new Error(result.error);
            }

            statusDiv.className = 'create-status success';
            statusDiv.textContent = 'Task data inserted! Check the form and click Create.';
            
            setTimeout(() => {
                chrome.tabs.update(tab.id, { active: true });
            }, 500);

        } catch (error) {
            console.error('Create task error:', error);
            statusDiv.className = 'create-status error';
            statusDiv.textContent = `Error: ${error.message}`;
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = 'Create in Jira';
        }
    }

    clearForm() {
        if (confirm('Clear the form and preview?')) {
            const descEl = document.getElementById('description');
            const previewEl = document.getElementById('preview');
            const statusEl = document.getElementById('createStatus');

            if (descEl) descEl.value = '';
            if (previewEl) previewEl.style.display = 'none';
            if (statusEl) statusEl.style.display = 'none';
        }
    }

    async analyzePage() {
        const btn = document.getElementById('analyzeBtn');
        if (!btn) {
            this.showStatus('Error: Analyze button not found', 'error');
            return;
        }

        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');

        if (!btnText || !loading) {
            this.showStatus('Error: Button elements not found', 'error');
            return;
        }

        btn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'inline';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!this.isJiraUrl(tab.url)) {
                throw new Error('Not a Jira page. Please open a Jira page first.');
            }
            
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (injectError) {
                console.log('Content script may already be injected:', injectError);
            }
            
            const result = await chrome.tabs.sendMessage(tab.id, {
                action: 'analyzePage'
            });

            if (result.error) {
                throw new Error(result.error);
            }

            this.displayAnalysis(result);
            this.showStatus('Analysis completed!', 'success');
        } catch (error) {
            console.error('Analysis error:', error);
            this.showStatus(`Analysis error: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    displayAnalysis(data) {
        if (!data) {
            this.showStatus('Error: No analysis data', 'error');
            return;
        }

        const projectNameEl = document.getElementById('projectName');
        const taskCountEl = document.getElementById('taskCount');
        const statusesEl = document.getElementById('statuses');
        const resultEl = document.getElementById('analyzeResult');

        if (!projectNameEl || !taskCountEl || !statusesEl || !resultEl) {
            this.showStatus('Error: Analysis elements not found', 'error');
            return;
        }

        projectNameEl.textContent = data.project || 'Unknown';
        taskCountEl.textContent = data.taskCount || '0';
        statusesEl.textContent = data.statuses || 'Unknown';
        resultEl.style.display = 'block';
    }

    async copyToClipboard(button) {
        if (!button) {
            return;
        }

        const fieldId = button.getAttribute('data-copy');
        if (!fieldId) {
            this.showStatus('Error: Field ID not found', 'error');
            return;
        }

        const field = document.getElementById(fieldId);
        if (!field) {
            this.showStatus('Error: Field not found', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(field.value || '');
            button.textContent = 'Copied';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        } catch (error) {
            this.showStatus('Copy error: ' + error.message, 'error');
        }
    }

    async saveSettings() {
        const openaiKeyEl = document.getElementById('openaiKey');
        if (!openaiKeyEl) {
            this.showStatus('Error: Settings field not found', 'error');
            return;
        }

        const openaiKey = openaiKeyEl.value;

        if (!openaiKey || !openaiKey.trim()) {
            this.showStatus('Enter OpenAI API key', 'error');
            return;
        }

        if (!openaiKey.startsWith('sk-')) {
            this.showStatus('Warning: API key should start with "sk-"', 'error');
            return;
        }

        try {
            await chrome.storage.sync.set({
                openaiKey: openaiKey.trim()
            });

            this.showStatus('Settings saved!', 'success');
        } catch (error) {
            this.showStatus('Settings save error: ' + error.message, 'error');
        }
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(['openaiKey']);
            const openaiKeyEl = document.getElementById('openaiKey');
            
            if (openaiKeyEl && settings.openaiKey) {
                openaiKeyEl.value = settings.openaiKey;
            }
        } catch (error) {
            console.error('Settings load error:', error);
        }
    }

    isJiraUrl(url) {
        if (!url) return false;
        const jiraPatterns = [
            /atlassian\.net/i,
            /atlassian\.com/i,
            /jira\.com/i,
            /\/jira\//i
        ];
        return jiraPatterns.some(pattern => pattern.test(url));
    }

    async getSettings() {
        return await chrome.storage.sync.get(['openaiKey']);
    }

    showStatus(message, type) {
        const status = document.getElementById('settingsStatus');
        if (status) {
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.display = 'block';

            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        } else {
            console.log(`Status: ${message} (${type})`);
        }
    }

    async runFullProjectAnalysis() {
        const btn = document.getElementById('fullAnalysisBtn');
        const status = document.getElementById('analysisStatus');

        if (!btn || !status) {
            this.showStatus('Error: Analysis elements not found', 'error');
            return;
        }

        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');

        if (!btnText || !loading) {
            this.showStatus('Error: Button elements not found', 'error');
            return;
        }
        
        try {
            btn.disabled = true;
            btnText.style.display = 'none';
            loading.style.display = 'inline';
            status.style.display = 'block';
            status.textContent = 'Scanning project page...';
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!this.isJiraUrl(tab.url)) {
                throw new Error('Not a Jira page. Please open a Jira project page.');
            }
            
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (injectError) {
                console.log('Content script may already be injected:', injectError);
            }
            
            status.textContent = 'Scanning project tasks...';
            const scanResult = await chrome.tabs.sendMessage(tab.id, {
                action: 'scanAllProjectIssues'
            });
            
            if (scanResult.error) {
                throw new Error(scanResult.error);
            }
            
            status.textContent = `Found ${scanResult.totalCount} tasks. Sending to backend...`;
            console.log('Scan result:', scanResult);
            const analysisResult = await chrome.tabs.sendMessage(tab.id, {
                action: 'sendToBackendForAnalysis',
                data: {
                    issueKeys: scanResult.issueKeys,
                    projectKey: scanResult.projectKey
                }
            });
            
            if (analysisResult.error) {
                throw new Error(analysisResult.error);
            }
            
            status.textContent = 'Analysis completed!';
            status.style.background = '#e8f5e9';
            this.displayFullAnalysisResult(analysisResult);
            
        } catch (error) {
            console.error('Full analysis error:', error);
            status.style.background = '#ffebee';
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Backend server is not running. Please start the server with: npm run dev';
            } else if (error.message.includes('Could not establish connection')) {
                errorMessage = 'Content script not loaded. Please refresh the page and try again.';
            }
            
            status.textContent = `Error: ${errorMessage}`;
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    displayFullAnalysisResult(result) {
        console.log('Display analysis result:', result);
        
        if (!result) {
            console.error('No result data to display');
            this.showStatus('Error: No analysis data', 'error');
            return;
        }
        
        const container = document.getElementById('fullAnalysisResult');
        if (!container) {
            console.error('Result container not found');
            this.showStatus('Error: Result container not found', 'error');
            return;
        }

        const projectKeyEl = document.getElementById('fullProjectKey');
        const totalIssuesEl = document.getElementById('fullTotalIssues');
        const categoriesEl = document.getElementById('fullCategories');
        const topLabelsEl = document.getElementById('fullTopLabels');
        const termsContainer = document.getElementById('fullCommonTerms');
        const examplesContainer = document.getElementById('fullBestExamples');

        if (!projectKeyEl || !totalIssuesEl || !categoriesEl || !topLabelsEl || !termsContainer || !examplesContainer) {
            this.showStatus('Error: Analysis display elements not found', 'error');
            return;
        }
        
        projectKeyEl.textContent = result.projectKey || '-';
        totalIssuesEl.textContent = result.totalIssues || result.totalCount || '0';
        let categoriesText = '-';
        if (result.categories) {
            if (typeof result.categories === 'object' && !Array.isArray(result.categories)) {
                categoriesText = Object.entries(result.categories)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
            } else {
                categoriesText = JSON.stringify(result.categories);
            }
        }
        categoriesEl.textContent = categoriesText;

        let labelsText = '-';
        if (result.topLabels && Array.isArray(result.topLabels)) {
            if (result.topLabels.length > 0) {
                if (typeof result.topLabels[0] === 'string') {
                    labelsText = result.topLabels.slice(0, 10).join(', ');
                } else if (result.topLabels[0].label) {
                    labelsText = result.topLabels.slice(0, 10)
                        .map(l => l.label || l.name || l)
                        .join(', ');
                }
            }
        }
        topLabelsEl.textContent = labelsText;

        if (result.commonTerms && Array.isArray(result.commonTerms) && result.commonTerms.length > 0) {
            termsContainer.innerHTML = result.commonTerms
                .slice(0, 20)
                .map(t => {
                    const term = t.term || t.name || t;
                    const count = t.count || t.frequency || '';
                    return `<span style="display: inline-block; margin: 3px; padding: 3px 8px; background: #e3f2fd; border-radius: 3px;">${term}${count ? ` (${count})` : ''}</span>`;
                })
                .join('');
        } else {
            termsContainer.textContent = 'No data';
        }

        if (result.bestExamples && Array.isArray(result.bestExamples) && result.bestExamples.length > 0) {
            examplesContainer.innerHTML = '<ul style="margin: 10px 0; padding-left: 20px;">' + 
                result.bestExamples.map(ex => {
                    const key = ex.key || ex.issueKey || '-';
                    const summary = ex.summary || ex.title || ex.description || '-';
                    return `<li style="margin: 5px 0;"><strong>${key}</strong>: ${summary}</li>`;
                }).join('') + 
                '</ul>';
        } else {
            examplesContainer.textContent = 'No data';
        }
        
        container.style.display = 'block';
        this.currentAnalysisResult = result;
        const generateBtn = document.getElementById('generateWithContextBtn');
        if (generateBtn) {
        generateBtn.onclick = () => {
            this.generateTaskWithContext(result);
        };
        }
    }

    async generateTaskWithContext(analysisResult) {
        if (!analysisResult) {
            this.showStatus('Error: No analysis data available', 'error');
            return;
        }

        const generateTab = document.querySelector('[data-tab="generate"]');
        if (generateTab) {
            generateTab.click();
        }
        
        const message = 'Enter task description. AI will generate it based on project context:\n' + 
              `- Project: ${analysisResult.projectKey || 'Unknown'}\n` +
              `- Total tasks: ${analysisResult.totalIssues || analysisResult.totalCount || '0'}\n` +
              `- Team style and common terms will be considered!`;
        
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JiraOpenAIExtension();
});
