class JiraOpenAIBackground {
    constructor() {
        this.contextMenuSetupInProgress = false;
        this.init();
    }

    init() {
        chrome.runtime.onInstalled.addListener(async (details) => {
            if (details.reason === 'install') {
                this.handleInstall();
            }
            await this.setupContextMenu();
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const result = this.handleMessage(request, sender, sendResponse);
            return result !== undefined ? result : true;
        });

        this.setupContextMenu();
        this.setupContextMenuClickHandler();
    }

    handleInstall() {
        console.log('Jira OpenAI Extension installed');
        
        chrome.storage.sync.set({
            openaiKey: '',
            version: '1.0.0'
        });
    }

    async handleMessage(request, sender, sendResponse) {
        console.log('Background received message:', request.action);
        
        try {
            switch (request.action) {
                case 'openPopup':
                    await this.openPopup();
                    sendResponse({ success: true });
                    return true;

                case 'analyzePage':
                    const analysis = await this.analyzeCurrentPage();
                    sendResponse(analysis);
                    return true;

                case 'generateTask':
                    const result = await this.generateTask(request.data);
                    sendResponse(result);
                    return true;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse(settings);
                    return true;

                case 'saveSettings':
                    await this.saveSettings(request.data);
                    sendResponse({ success: true });
                    return true;

                default:
                    sendResponse({ error: 'Unknown action' });
                    return false;
            }
        } catch (error) {
            console.error('Background message error:', error);
            sendResponse({ error: error.message });
            return false;
        }
    }

    async openPopup() {
        chrome.action.openPopup();
    }

    async analyzeCurrentPage() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!this.isJiraUrl(tab.url)) {
            throw new Error('Not a Jira page');
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (error) {
        }
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'analyzePage'
        });

        return response;
    }

    async generateTask(data) {
        const settings = await this.getSettings();
        
        if (!settings.openaiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.buildPrompt(data.description, data.category);
        
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
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
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

    async saveSettings(data) {
        await chrome.storage.sync.set(data);
    }

    async setupContextMenu() {
        if (this.contextMenuSetupInProgress) {
            return;
        }
        
        this.contextMenuSetupInProgress = true;
        
        try {
            await new Promise((resolve) => {
                chrome.contextMenus.removeAll(() => {
                    resolve();
                });
            });

            chrome.contextMenus.create({
                id: 'jira-openai-generate',
                title: 'Generate task with AI',
                contexts: ['page'],
                documentUrlPatterns: [
                    'https://*.atlassian.net/*',
                    'https://*.atlassian.com/*',
                    'https://*.jira.com/*',
                    'http://*.jira.com/*'
                ]
            }, () => {
                const error = chrome.runtime.lastError;
                if (error && !error.message.includes('duplicate') && !error.message.includes('Cannot create item')) {
                    console.error('Error creating menu:', error.message);
                }
            });

            chrome.contextMenus.create({
                id: 'jira-openai-analyze',
                title: 'Analyze page',
                contexts: ['page'],
                documentUrlPatterns: [
                    'https://*.atlassian.net/*',
                    'https://*.atlassian.com/*',
                    'https://*.jira.com/*',
                    'http://*.jira.com/*'
                ]
            }, () => {
                const error = chrome.runtime.lastError;
                if (error && !error.message.includes('duplicate') && !error.message.includes('Cannot create item')) {
                    console.error('Error creating menu:', error.message);
                }
            });
        } catch (error) {
            console.error('Error setting up context menu:', error);
        } finally {
            this.contextMenuSetupInProgress = false;
        }
    }

    setupContextMenuClickHandler() {
        if (this.contextMenuHandlerSetup) {
            return;
        }
        
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'jira-openai-generate') {
                this.openPopup();
            } else if (info.menuItemId === 'jira-openai-analyze') {
                this.analyzeCurrentPage();
            }
        });
        
        this.contextMenuHandlerSetup = true;
    }
}

new JiraOpenAIBackground();
