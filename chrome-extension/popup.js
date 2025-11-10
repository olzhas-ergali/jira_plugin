class JiraOpenAIExtension {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupEventListeners();
        this.loadSettings();
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
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateTask();
        });

        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzePage();
        });

        document.getElementById('fullAnalysisBtn').addEventListener('click', () => {
            this.runFullProjectAnalysis();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyToClipboard(e.target);
            }
        });
    }

    async generateTask() {
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const btn = document.getElementById('generateBtn');
        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');

        if (!description.trim()) {
            this.showStatus('Enter task description', 'error');
            return;
        }

        if (!category) {
            this.showStatus('Select category', 'error');
            return;
        }

        btn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'inline';

        try {
            const result = await this.callOpenAI(description, category);
            this.displayResult(result);
            this.showStatus('Task generated!', 'success');
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
            throw new Error(`OpenAI API ошибка: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        return this.parseOpenAIResponse(content);
    }

    buildPrompt(description, category) {
        return `Create a Jira task in category "${category}".

Description: ${description}

Create:
1. Task title (brief and clear)
2. Detailed description with sections:
   - Goal
   - What needs to be done
   - Acceptance criteria
3. Labels (comma-separated)
4. Priority (High/Medium/Low)

Response format:
TITLE: [title]
DESCRIPTION: [description]
LABELS: [labels]
PRIORITY: [priority]`;
    }

    parseOpenAIResponse(content) {
        const lines = content.split('\n');
        const result = {
            title: '',
            description: '',
            labels: '',
            priority: ''
        };

        lines.forEach(line => {
            if (line.startsWith('TITLE:') || line.startsWith('НАЗВАНИЕ:')) {
                result.title = line.replace(/TITLE:|НАЗВАНИЕ:/, '').trim();
            } else if (line.startsWith('DESCRIPTION:') || line.startsWith('ОПИСАНИЕ:')) {
                result.description = line.replace(/DESCRIPTION:|ОПИСАНИЕ:/, '').trim();
            } else if (line.startsWith('LABELS:') || line.startsWith('МЕТКИ:')) {
                result.labels = line.replace(/LABELS:|МЕТКИ:/, '').trim();
            } else if (line.startsWith('PRIORITY:') || line.startsWith('ПРИОРИТЕТ:')) {
                result.priority = line.replace(/PRIORITY:|ПРИОРИТЕТ:/, '').trim();
            }
        });

        return result;
    }

    displayResult(result) {
        document.getElementById('title').value = result.title;
        document.getElementById('description-result').value = result.description;
        document.getElementById('labels').value = result.labels;
        document.getElementById('result').style.display = 'block';
    }

    async analyzePage() {
        const btn = document.getElementById('analyzeBtn');
        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');

        btn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'inline';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const result = await chrome.tabs.sendMessage(tab.id, {
                action: 'analyzePage'
            });

            this.displayAnalysis(result);
            this.showStatus('Analysis completed!', 'success');
        } catch (error) {
            this.showStatus(`Analysis error: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    displayAnalysis(data) {
        document.getElementById('projectName').textContent = data.project || 'Не определен';
        document.getElementById('taskCount').textContent = data.taskCount || '0';
        document.getElementById('statuses').textContent = data.statuses || 'Не определены';
        document.getElementById('analyzeResult').style.display = 'block';
    }

    async copyToClipboard(button) {
        const fieldId = button.getAttribute('data-copy');
        const field = document.getElementById(fieldId);
        
        try {
            await navigator.clipboard.writeText(field.value);
            button.textContent = '✅';
            setTimeout(() => {
                button.textContent = '📋';
            }, 2000);
        } catch (error) {
            this.showStatus('Copy error', 'error');
        }
    }

    async saveSettings() {
        const openaiKey = document.getElementById('openaiKey').value;
        const jiraUrl = document.getElementById('jiraUrl').value;

        if (!openaiKey.trim()) {
            this.showStatus('Enter OpenAI API key', 'error');
            return;
        }

        try {
            await chrome.storage.sync.set({
                openaiKey: openaiKey,
                jiraUrl: jiraUrl
            });

            this.showStatus('Settings saved!', 'success');
        } catch (error) {
            this.showStatus('Settings save error', 'error');
        }
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(['openaiKey', 'jiraUrl']);
            
            if (settings.openaiKey) {
                document.getElementById('openaiKey').value = settings.openaiKey;
            }
            if (settings.jiraUrl) {
                document.getElementById('jiraUrl').value = settings.jiraUrl;
            }
        } catch (error) {
            console.error('Settings load error:', error);
        }
    }

    async getSettings() {
        return await chrome.storage.sync.get(['openaiKey', 'jiraUrl']);
    }

    showStatus(message, type) {
        const status = document.getElementById('settingsStatus');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    async runFullProjectAnalysis() {
        const btn = document.getElementById('fullAnalysisBtn');
        const btnText = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.loading');
        const status = document.getElementById('analysisStatus');
        
        try {
            btn.disabled = true;
            btnText.style.display = 'none';
            loading.style.display = 'inline';
            status.style.display = 'block';
            status.textContent = 'Scanning project page...';
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url.includes('atlassian.net') && !tab.url.includes('jira.com') && !tab.url.includes('jira')) {
                throw new Error('Not a Jira page. Please open a Jira project page.');
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
            this.displayFullAnalysisResult(analysisResult.data || analysisResult);
            
        } catch (error) {
            status.textContent = `Error: ${error.message}`;
            status.style.background = '#ffebee';
            console.error('Full analysis error:', error);
            
            if (error.message.includes('fetch')) {
                status.textContent = 'Backend not available. Run: npm run dev';
            }
        } finally {
            btn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    displayFullAnalysisResult(result) {
        console.log('Display analysis result:', result);
        
        const container = document.getElementById('fullAnalysisResult');
        document.getElementById('fullProjectKey').textContent = result.projectKey || '-';
        document.getElementById('fullTotalIssues').textContent = result.totalIssues || '0';
        document.getElementById('fullCategories').textContent = 
            result.categories ? JSON.stringify(result.categories) : '-';
        document.getElementById('fullTopLabels').textContent = 
            result.topLabels ? result.topLabels.slice(0, 10).join(', ') : '-';
        const termsContainer = document.getElementById('fullCommonTerms');
        if (result.commonTerms && result.commonTerms.length > 0) {
            termsContainer.innerHTML = result.commonTerms
                .slice(0, 20)
                .map(t => `<span style="display: inline-block; margin: 3px; padding: 3px 8px; background: #e3f2fd; border-radius: 3px;">${t.term} (${t.count})</span>`)
                .join('');
        } else {
            termsContainer.textContent = 'No data';
        }
        const examplesContainer = document.getElementById('fullBestExamples');
        if (result.bestExamples && result.bestExamples.length > 0) {
            examplesContainer.innerHTML = '<ul style="margin: 10px 0; padding-left: 20px;">' + 
                result.bestExamples.map(ex => 
                    `<li style="margin: 5px 0;"><strong>${ex.key}</strong>: ${ex.summary}</li>`
                ).join('') + 
                '</ul>';
        } else {
            examplesContainer.textContent = 'No data';
        }
        
        container.style.display = 'block';
        this.currentAnalysisResult = result;
        const generateBtn = document.getElementById('generateWithContextBtn');
        generateBtn.onclick = () => {
            this.generateTaskWithContext(result);
        };
    }

    async generateTaskWithContext(analysisResult) {
        document.querySelector('[data-tab="generate"]').click();
        
        alert('Enter task description. AI will generate it based on project context: ' + 
              `\n- Project: ${analysisResult.projectKey}` +
              `\n- Total tasks: ${analysisResult.totalIssues}` +
              `\n- Team style and common terms will be considered!`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JiraOpenAIExtension();
});
