// Content Script for Jira pages
class JiraPageAnalyzer {
    constructor() {
        this.init();
    }

    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'analyzePage') {
                const analysis = this.analyzeCurrentPage();
                sendResponse(analysis);
            }
            else if (request.action === 'scanAllProjectIssues') {
                this.scanAllProjectIssues()
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ error: error.message }));
                return true;
            }
            else if (request.action === 'sendToBackendForAnalysis') {
                this.sendToBackendForAnalysis(
                    request.data.issueKeys,
                    request.data.projectKey
                )
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ error: error.message }));
                return true;
            }
        });

        this.addExtensionButton();
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
        const urlMatch = window.location.href.match(/projectKey=([A-Z]+)|\/browse\/([A-Z]+)/);
        if (urlMatch) {
            return urlMatch[1] || urlMatch[2];
        }
        const issueKeyMatch = window.location.href.match(/([A-Z]+)-\d+/);
        if (issueKeyMatch) {
            return issueKeyMatch[1];
        }
        const projectElement = document.querySelector('[data-testid="project-key"], .project-key');
        if (projectElement) {
            return projectElement.textContent.trim();
        }
        const firstIssue = document.querySelector('[data-issue-key]');
        if (firstIssue) {
            const key = firstIssue.getAttribute('data-issue-key');
            const match = key.match(/^([A-Z]+)-\d+$/);
            if (match) return match[1];
        }
        
        return null;
    }

    async sendToBackendForAnalysis(issueKeys, projectKey) {
        console.log('Sending data to backend...');
        
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
                const errorData = await response.json();
                throw new Error(errorData.message || `Backend error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Backend response:', result);
            
            return result;
        } catch (error) {
            console.error('Error sending to backend:', error);
            throw error;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getProjectName() {
        const projectSelectors = [
            '[data-testid="project-name"]',
            '.project-name',
            '[data-testid="project-selector"]',
            '.project-selector'
        ];

        for (const selector of projectSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }

        const urlMatch = window.location.href.match(/projectKey=([A-Z]+)/);
        if (urlMatch) {
            return urlMatch[1];
        }

        return 'Unknown';
    }

    getTaskCount() {
        const taskSelectors = [
            '[data-testid="issue-row"]',
            '.issue-row',
            '[data-testid="issue-card"]',
            '.issue-card',
            'tr[data-issue-key]'
        ];

        let count = 0;
        for (const selector of taskSelectors) {
            const elements = document.querySelectorAll(selector);
            count += elements.length;
        }

        return count;
    }

    getStatuses() {
        const statusElements = document.querySelectorAll('[data-testid="status"], .status, .issue-status');
        const statuses = new Set();

        statusElements.forEach(element => {
            const status = element.textContent.trim();
            if (status) {
                statuses.add(status);
            }
        });

        return Array.from(statuses).join(', ') || 'Unknown';
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 15px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            user-select: none;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', () => {
            this.openExtensionPopup();
        });

        document.body.appendChild(button);
    }

    openExtensionPopup() {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    }

    injectIntoJiraForm(title, description, labels) {
        const titleField = document.querySelector('#summary, [name="summary"], [data-testid="summary"]');
        const descriptionField = document.querySelector('#description, [name="description"], [data-testid="description"]');
        const labelsField = document.querySelector('#labels, [name="labels"], [data-testid="labels"]');

        if (titleField) {
            titleField.value = title;
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (descriptionField) {
            descriptionField.value = description;
            descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (labelsField) {
            labelsField.value = labels;
            labelsField.dispatchEvent(new Event('input', { bubbles: true }));
        }

        this.showNotification('Data inserted into Jira form', 'success');
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
