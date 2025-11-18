const axios = require('axios');
const config = require('../config/config');

class ProjectAnalyzer {
  constructor() {
    this.baseUrl = config.jira.baseUrl;
    this.username = config.jira.username;
    this.apiToken = config.jira.apiToken;
    
    this.api = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      auth: {
        username: this.username,
        password: this.apiToken
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async analyzeProject(issueKeys, projectKey) {
    console.log(`Analyzing ${issueKeys.length} issues from project ${projectKey}...`);
    
    const allIssues = await this.loadAllIssues(issueKeys);
    const analysis = this.performAnalysis(allIssues, projectKey);
    
    return analysis;
  }

  async loadAllIssues(issueKeys) {
    const batchSize = 50;
    const allIssues = [];
    
    for (let i = 0; i < issueKeys.length; i += batchSize) {
      const batch = issueKeys.slice(i, i + batchSize);
      const jql = `key in (${batch.join(',')})`;
      
      try {
        const response = await this.api.get('/search', {
          params: {
            jql: jql,
            maxResults: batchSize,
            fields: [
              'summary',
              'description',
              'status',
              'priority',
              'labels',
              'issuetype',
              'created',
              'updated'
            ]
          }
        });
        
        allIssues.push(...response.data.issues);
        console.log(`Loaded ${allIssues.length}/${issueKeys.length} issues`);
        
        await this.sleep(500);
      } catch (error) {
        console.error(`Error loading batch ${i}:`, error.message);
      }
    }
    
    return allIssues;
  }

  performAnalysis(issues, projectKey) {
    const categories = {};
    const priorities = {};
    const statuses = {};
    const labels = {};
    const termFrequency = {};
    
    issues.forEach(issue => {
      const category = this.detectCategory(issue);
      categories[category] = (categories[category] || 0) + 1;
      
      const priority = issue.fields.priority?.name || 'None';
      priorities[priority] = (priorities[priority] || 0) + 1;
      
      const status = issue.fields.status?.name || 'Unknown';
      statuses[status] = (statuses[status] || 0) + 1;
      
      (issue.fields.labels || []).forEach(label => {
        labels[label] = (labels[label] || 0) + 1;
      });
      
      const text = `${issue.fields.summary} ${this.extractDescription(issue.fields.description)}`;
      this.extractTerms(text, termFrequency);
    });
    
    const topLabels = Object.entries(labels)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([label]) => label);
    
    const commonTerms = Object.entries(termFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([term, count]) => ({ term, count }));
    
    const bestExamples = this.findBestExamples(issues);
    
    return {
      projectKey,
      totalIssues: issues.length,
      categories,
      priorities,
      statuses,
      topLabels,
      commonTerms,
      bestExamples
    };
  }

  detectCategory(issue) {
    const text = `${issue.fields.summary} ${this.extractDescription(issue.fields.description)}`.toLowerCase();
    
    if (text.match(/backend|api|server|database/i)) return 'Backend';
    if (text.match(/frontend|ui|ux|interface/i)) return 'Frontend';
    if (text.match(/devops|ci\/cd|deploy|docker/i)) return 'DevOps';
    if (text.match(/analytics|dashboard|metrics/i)) return 'Analytics';
    if (text.match(/infrastructure|system|security/i)) return 'Infrastructure';
    
    return 'Other';
  }

  extractDescription(description) {
    if (!description) return '';
    if (typeof description === 'string') return description;
    if (description.content) {
      return JSON.stringify(description.content);
    }
    return '';
  }

  extractTerms(text, termFrequency) {
    const stopWords = ['the', 'a', 'to', 'of', 'and', 'in', 'is', 'for', 'on', 'with'];
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    words.forEach(word => {
      if (!stopWords.includes(word)) {
        termFrequency[word] = (termFrequency[word] || 0) + 1;
      }
    });
  }

  findBestExamples(issues) {
    return issues
      .filter(issue => {
        const desc = this.extractDescription(issue.fields.description);
        return desc.length > 100;
      })
      .sort((a, b) => {
        const aDesc = this.extractDescription(a.fields.description);
        const bDesc = this.extractDescription(b.fields.description);
        return bDesc.length - aDesc.length;
      })
      .slice(0, 5)
      .map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        category: this.detectCategory(issue),
        priority: issue.fields.priority?.name || 'None',
        status: issue.fields.status?.name || 'Unknown'
      }));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ProjectAnalyzer();


