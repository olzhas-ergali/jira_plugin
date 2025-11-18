class JiraPageAnalyzer {
    constructor() {
        console.log('Jira Page Analyzer initializing...');
        this.init();
    }

    init() {
        console.log('Setting up message listeners...');
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script received message:', request.action);
            
            if (request.action === 'analyzePage') {
                try {
                    const analysis = this.analyzeCurrentPage();
                    sendResponse(analysis);
                } catch (error) {
                    console.error('Error in analyzePage:', error);
                    sendResponse({ error: error.message });
                }
                return true;
            }
            else if (request.action === 'scanAllProjectIssues') {
                this.scanAllProjectIssues()
                    .then(result => {
                        console.log('Scan result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('Scan error:', error);
                        sendResponse({ error: error.message });
                    });
                return true;
            }
            else if (request.action === 'sendToBackendForAnalysis') {
                this.sendToBackendForAnalysis(
                    request.data.issueKeys,
                    request.data.projectKey
                )
                    .then(result => {
                        console.log('Backend analysis result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('Backend analysis error:', error);
                        sendResponse({ error: error.message });
                    });
                return true;
            }
            else if (request.action === 'injectIntoJiraForm') {
                try {
                    this.injectIntoJiraForm(
                        request.data.title,
                        request.data.description,
                        request.data.labels,
                        request.data.priority
                    );
                    sendResponse({ success: true });
                } catch (error) {
                    console.error('Inject error:', error);
                    sendResponse({ error: error.message });
                }
                return true;
            }
            else {
                console.warn('Unknown action:', request.action);
                sendResponse({ error: 'Unknown action' });
                return false;
            }
        });

        this.addExtensionButton();
        console.log('Jira Page Analyzer ready!');
    }

    analyzeCurrentPage() {
        const analysis = {
            project: this.getProjectName(),
            taskCount: this.getTaskCount(),
            statuses: this.getStatuses(),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        return analysis;
    }

    async scanAllProjectIssues() {
        console.log('Scanning project...');
        
        const projectKey = this.getProjectKey();
        if (!projectKey) {
            throw new Error('Could not determine Project Key');
        }
        
        const allIssueKeys = new Set();
        
        this.collectIssueKeysFromPage(allIssueKeys);
        console.log(`Collected ${allIssueKeys.size} tasks from current page`);
        
        const hasPagination = this.hasPagination();
        
        if (hasPagination) {
            await this.loadAllPages(allIssueKeys);
        }
        
        console.log(`Found ${allIssueKeys.size} issues in project ${projectKey}`);
        
        return {
            projectKey: projectKey,
            issueKeys: Array.from(allIssueKeys),
            totalCount: allIssueKeys.size,
            url: window.location.href
        };
    }

    collectIssueKeysFromPage(issueKeysSet) {
        const selectors = [
            '[data-issue-key]',
            'a[href*="/browse/"]',
            '.issue-link',
            '[data-testid="issue-key"]',
            'tr[data-issue-key]',
            '.ghx-issue-key',
            '.sc-issue-key',
            '[data-test-id*="issue"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                let issueKey = this.extractIssueKey(el);
                
                if (issueKey && issueKey.match(/^[A-Z]+-\d+$/)) {
                    issueKeysSet.add(issueKey);
                }
            });
        });
    }

    extractIssueKey(element) {
        let issueKey = element.getAttribute('data-issue-key');
        
        if (!issueKey) {
            const href = element.getAttribute('href');
            if (href) {
                const match = href.match(/([A-Z]+-\d+)/);
                if (match) issueKey = match[1];
            }
        }
        
        if (!issueKey) {
            const text = element.textContent;
            const match = text.match(/([A-Z]+-\d+)/);
            if (match) issueKey = match[1];
        }
        
        return issueKey;
    }

    hasPagination() {
        const paginationSelectors = [
            '.pagination',
            '[data-testid="pagination"]',
            'button[aria-label*="Next"]',
            'button[aria-label*="next"]',
            'a[aria-label*="Next"]',
            '.load-more',
            '[data-testid="load-more"]',
            'button:contains("Show more")',
            'button:contains("Load more")'
        ];
        
        return paginationSelectors.some(selector => 
            document.querySelector(selector) !== null
        );
    }

    async loadAllPages(issueKeysSet) {
        let hasMore = true;
        let pageCount = 0;
        const maxPages = 50;
        const initialCount = issueKeysSet.size;
        
        while (hasMore && pageCount < maxPages) {
            const loadMoreBtn = document.querySelector(
                '.load-more, [data-testid="load-more"], button:contains("Show more"), button:contains("Load more")'
            );
            const nextPageBtn = document.querySelector(
                'button[aria-label*="Next"], button[aria-label*="next"], a[aria-label*="Next"]'
            );
            
            let clicked = false;
            
            if (loadMoreBtn && !loadMoreBtn.disabled && !loadMoreBtn.classList.contains('disabled')) {
                loadMoreBtn.click();
                clicked = true;
            } else if (nextPageBtn && !nextPageBtn.disabled && !nextPageBtn.classList.contains('disabled')) {
                nextPageBtn.click();
                clicked = true;
            }
            
            if (clicked) {
                await this.wait(2000);
                
                const beforeCount = issueKeysSet.size;
                this.collectIssueKeysFromPage(issueKeysSet);
                const afterCount = issueKeysSet.size;
                
                pageCount++;
                console.log(`Loaded pages: ${pageCount}, issues: ${issueKeysSet.size}`);
                if (beforeCount === afterCount) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }
        
        console.log(`Loaded additional: ${issueKeysSet.size - initialCount} issues`);
    }

    getProjectKey() {
        console.log('Extracting project key from:', window.location.href);
        
        const urlPatterns = [
            /projectKey=([A-Z]+)/i,
            /\/browse\/([A-Z]+)/i,
            /\/projects\/([A-Z]+)/i,
            /\/secure\/RapidBoard\.jspa\?projectKey=([A-Z]+)/i,
            /\/jira\/software\/projects\/([A-Z]+)/i,
            /\/browse\/([A-Z]+)-\d+/i,
            /projectKey=([A-Z]+)/i
        ];

        for (const pattern of urlPatterns) {
            const match = window.location.href.match(pattern);
            if (match && match[1]) {
                const key = match[1].toUpperCase();
                if (key.match(/^[A-Z]+$/)) {
                    console.log('Found project key from URL:', key);
                    return key;
                }
            }
        }
        
        const issueKeyMatch = window.location.href.match(/([A-Z]+)-\d+/i);
        if (issueKeyMatch && issueKeyMatch[1]) {
            const key = issueKeyMatch[1].toUpperCase();
            console.log('Found project key from issue in URL:', key);
            return key;
        }
        
        const projectSelectors = [
            '[data-testid="project-key"]',
            '[data-project-key]',
            '.project-key',
            '[data-testid="project-selector"]',
            'meta[name="ajs-project-key"]',
            '[data-project-id]',
            '.project-selector',
            '[aria-label*="project" i]'
        ];

        for (const selector of projectSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                let key = element.getAttribute('data-project-key') || 
                         element.getAttribute('data-project-id') ||
                         element.getAttribute('content') ||
                         element.textContent.trim();
                if (key) {
                    const match = key.match(/([A-Z]+)/i);
                    if (match) {
                        const projectKey = match[1].toUpperCase();
                        if (projectKey.match(/^[A-Z]+$/)) {
                            console.log('Found project key from DOM:', projectKey);
                            return projectKey;
                        }
                    }
                }
            }
        }
        
        const issueSelectors = [
            '[data-issue-key]',
            'a[href*="/browse/"]',
            '.issue-key',
            '[data-testid="issue-key"]'
        ];

        for (const selector of issueSelectors) {
            const firstIssue = document.querySelector(selector);
            if (firstIssue) {
                let key = firstIssue.getAttribute('data-issue-key');
                if (!key) {
                    const href = firstIssue.getAttribute('href');
                    if (href) {
                        const match = href.match(/([A-Z]+)-\d+/i);
                        if (match) key = match[1];
                    }
                }
                if (!key) {
                    const text = firstIssue.textContent;
                    const match = text.match(/([A-Z]+)-\d+/i);
                    if (match) key = match[1];
                }
                if (key) {
                    const match = key.match(/^([A-Z]+)/i);
                    if (match) {
                        const projectKey = match[1].toUpperCase();
                        if (projectKey.match(/^[A-Z]+$/)) {
                            console.log('Found project key from issue:', projectKey);
                            return projectKey;
                        }
                    }
                }
            }
        }
        
        console.warn('Could not determine project key');
        return null;
    }

    async sendToBackendForAnalysis(issueKeys, projectKey) {
        console.log('Sending data to backend...', { projectKey, issueCount: issueKeys.length });
        
        const backendUrl = 'http://localhost:3000/api/project/full-analysis';
        
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectKey: projectKey,
                    issueKeys: issueKeys,
                    source: 'chrome-extension',
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                let errorMessage = `Backend error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('Backend response:', result);
            return result.data || result;
        } catch (error) {
            console.error('Error sending to backend:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Backend server is not running. Please start the server with: npm run dev');
            }
            
            throw error;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getProjectName() {
        const urlMatch = window.location.href.match(/projectKey=([A-Z]+)|\/browse\/([A-Z]+)|\/projects\/([A-Z]+)/);
        if (urlMatch) {
            return urlMatch[1] || urlMatch[2] || urlMatch[3];
        }

        const projectSelectors = [
            '[data-testid="project-name"]',
            '.project-name',
            '[data-project-key]',
            '[data-testid="project-selector"]',
            '.project-selector',
            'meta[name="ajs-project-key"]'
        ];

        for (const selector of projectSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const key = element.getAttribute('data-project-key') || 
                           element.getAttribute('content') ||
                           element.textContent.trim();
                if (key) return key;
            }
        }

        const issueKey = this.extractIssueKey(document.body);
        if (issueKey) {
            const match = issueKey.match(/^([A-Z]+)-/);
            if (match) return match[1];
        }

        return 'Unknown';
    }

    getTaskCount() {
        const taskSelectors = [
            '[data-issue-key]',
            '[data-testid="issue-row"]',
            '.issue-row',
            '[data-testid="issue-card"]',
            '.issue-card',
            'tr[data-issue-key]',
            '.ghx-issue',
            '[data-test-id*="issue"]',
            'a[href*="/browse/"]'
        ];

        const foundKeys = new Set();
        
        for (const selector of taskSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const key = this.extractIssueKey(el);
                if (key) foundKeys.add(key);
            });
        }

        return foundKeys.size;
    }

    getStatuses() {
        const statusSelectors = [
            '[data-testid="status"]',
            '.status',
            '.issue-status',
            '[data-status]',
            '.ghx-status',
            'span[class*="status"]',
            'span[title*="Status"]'
        ];
        
        const statuses = new Set();

        statusSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const status = element.getAttribute('data-status') || 
                              element.getAttribute('title') ||
                              element.textContent.trim();
                if (status && status.length > 0 && status.length < 50) {
                    statuses.add(status);
                }
            });
        });

        return Array.from(statuses).slice(0, 10).join(', ') || 'Unknown';
    }

    addExtensionButton() {
        if (document.getElementById('jira-openai-extension-btn')) {
            return;
        }

        const button = document.createElement('div');
        button.id = 'jira-openai-extension-btn';
        button.innerHTML = 'AI';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #000;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            user-select: none;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#333';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#000';
        });

        button.addEventListener('click', () => {
            this.openExtensionPopup();
        });

        document.body.appendChild(button);
    }

    openExtensionPopup() {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    }

    injectIntoJiraForm(title, description, labels, priority) {
        if (!title || !title.trim()) {
            this.showNotification('Error: Title is required', 'info');
            return;
        }

        const titleSelectors = [
            '#summary',
            '[name="summary"]',
            '[data-testid="summary"]',
            '[id*="summary"]',
            'input[aria-label*="Summary" i]',
            'input[aria-label*="Title" i]',
            'input[placeholder*="summary" i]',
            'input[placeholder*="title" i]',
            '.summary-field input',
            '.issue-summary',
            '[data-field-id="summary"]',
            'input[name*="summary" i]'
        ];

        const descriptionSelectors = [
            '#description',
            '[name="description"]',
            '[data-testid="description"]',
            '[id*="description"]',
            'textarea[aria-label*="Description" i]',
            '.ql-editor',
            '[contenteditable="true"]',
            '.description-field',
            '.issue-description',
            '[data-field-id="description"]',
            'textarea[name*="description" i]',
            '.ak-editor-content-area',
            '[role="textbox"]'
        ];

        const labelsSelectors = [
            '#labels',
            '[name="labels"]',
            '[data-testid="labels"]',
            '[id*="labels"]',
            'input[aria-label*="Labels" i]',
            '.labels-field input',
            '[data-field-id="labels"]',
            'input[name*="labels" i]'
        ];

        const prioritySelectors = [
            '#priority',
            '[name="priority"]',
            '[data-testid="priority"]',
            '[id*="priority"]',
            'select[aria-label*="Priority" i]',
            '.priority-field select',
            '[data-field-id="priority"]',
            'select[name*="priority" i]'
        ];

        const titleField = this.findElement(titleSelectors);
        const descriptionField = this.findElement(descriptionSelectors);
        const labelsField = this.findElement(labelsSelectors);
        const priorityField = this.findElement(prioritySelectors);

        let filled = false;

        if (titleField) {
            if (titleField.tagName === 'INPUT' || titleField.tagName === 'TEXTAREA') {
                titleField.value = title;
                titleField.dispatchEvent(new Event('input', { bubbles: true }));
                titleField.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (titleField.contentEditable === 'true') {
                titleField.textContent = title;
                titleField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            filled = true;
        }

        if (descriptionField) {
            if (descriptionField.tagName === 'TEXTAREA' || descriptionField.tagName === 'INPUT') {
                descriptionField.value = description;
                descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
                descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (descriptionField.contentEditable === 'true' || descriptionField.classList.contains('ql-editor')) {
                descriptionField.innerHTML = description.replace(/\n/g, '<br>');
                descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            filled = true;
        }

        if (labelsField && labels) {
            if (labelsField.tagName === 'INPUT' || labelsField.tagName === 'TEXTAREA') {
                labelsField.value = labels;
                labelsField.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        if (priorityField && priority && priorityField.tagName === 'SELECT') {
            const option = Array.from(priorityField.options).find(opt => 
                opt.text.toLowerCase().includes(priority.toLowerCase())
            );
            if (option) {
                priorityField.value = option.value;
                priorityField.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        if (filled) {
            this.showNotification('Task data inserted! Review and click Create.', 'success');
        } else {
            this.showNotification('Could not find form fields. Please open Create Issue page in Jira.', 'info');
        }
    }

    findElement(selectors) {
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element && (element.offsetParent !== null || element.offsetHeight > 0 || element.offsetWidth > 0)) {
                    return element;
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10001;
            background: ${type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new JiraPageAnalyzer();
    });
} else {
    new JiraPageAnalyzer();
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
