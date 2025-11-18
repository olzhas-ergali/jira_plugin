import api, { route } from '@forge/api';
import { render } from '@forge/ui';
import { OpenAIService } from './services/openaiService';
import { TaskService } from './services/taskService';
import { TemplateService } from './services/templateService';

const openaiService = new OpenAIService();
const taskService = new TaskService();
const templateService = new TemplateService();

export const run = async (event, context) => {
  console.log('Jira OpenAI Automation Plugin started');
  
  try {
    switch (event.type) {
      case 'jira:issue_created':
        await handleIssueCreated(event, context);
        break;
      case 'jira:issue_updated':
        await handleIssueUpdated(event, context);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('Error in plugin:', error);
  }
};

async function handleIssueCreated(event, context) {
  const issue = event.issue;
  console.log('New issue created:', issue.key);
  
  if (shouldEnhanceIssue(issue)) {
    await enhanceIssueWithAI(issue, context);
  }
}

async function handleIssueUpdated(event, context) {
  const issue = event.issue;
  console.log('Issue updated:', issue.key);
  
}

function shouldEnhanceIssue(issue) {
  const labels = issue.fields.labels || [];
  return labels.includes('ai-enhance') || labels.includes('auto-generate');
}

async function enhanceIssueWithAI(issue, context) {
  try {
    console.log('Enhancing issue with AI:', issue.key);
    
    const issueDetails = await taskService.getIssueDetails(issue.key);
    
    const category = determineCategory(issueDetails);
    
    const enhancedContent = await openaiService.generateTaskContent(
      issueDetails.summary,
      category,
      await templateService.getTemplate(category)
    );
    
    await taskService.updateIssue(issue.key, {
      summary: enhancedContent.title,
      description: enhancedContent.description,
      labels: [...(issue.fields.labels || []), ...enhancedContent.labels]
    });
    
    console.log('Issue enhanced successfully:', issue.key);
  } catch (error) {
    console.error('Error enhancing issue:', error);
  }
}

function determineCategory(issueDetails) {
  const summary = issueDetails.summary.toLowerCase();
  const labels = (issueDetails.labels || []).map(label => label.toLowerCase());
  
  if (summary.includes('devops') || labels.includes('devops')) return 'DevOps';
  if (summary.includes('analytics') || labels.includes('analytics')) return 'Аналитика';
  if (summary.includes('backend') || labels.includes('backend')) return 'Backend';
  if (summary.includes('frontend') || labels.includes('frontend')) return 'Frontend';
  if (summary.includes('infrastructure') || labels.includes('infrastructure')) return 'Инфраструктура';
  
  return 'Backend'; // По умолчанию
}

export const router = route({
  path: '/api/automation',
  method: 'POST',
  handler: async (req, res) => {
    try {
      const { action, issueKey, options } = await req.json();
      
      switch (action) {
        case 'enhance':
          await enhanceIssue(issueKey, options);
          break;
        case 'create-from-template':
          await createFromTemplate(issueKey, options);
          break;
        case 'clone-task':
          await cloneTask(issueKey, options);
          break;
        default:
          return res.status(400).json({ error: 'Unknown action' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

async function enhanceIssue(issueKey, options) {
  const issueDetails = await taskService.getIssueDetails(issueKey);
  const category = determineCategory(issueDetails);
  
  const enhancedContent = await openaiService.generateTaskContent(
    issueDetails.summary,
    category,
    await templateService.getTemplate(category)
  );
  
  await taskService.updateIssue(issueKey, {
    summary: enhancedContent.title,
    description: enhancedContent.description,
    labels: [...(issueDetails.labels || []), ...enhancedContent.labels]
  });
}

async function createFromTemplate(issueKey, options) {
  const { template, category } = options;
  
  const templateData = await templateService.getTemplate(category);
  const generatedContent = await openaiService.generateTaskContent(
    template.description,
    category,
    templateData
  );
  
  await taskService.createIssue({
    project: { key: options.projectKey },
    issuetype: { name: options.issueType || 'Task' },
    summary: generatedContent.title,
    description: generatedContent.description,
    labels: generatedContent.labels,
    assignee: options.assignee ? { accountId: options.assignee } : undefined
  });
}

async function cloneTask(issueKey, options) {
  const sourceIssue = await taskService.getIssueDetails(issueKey);
  const category = determineCategory(sourceIssue);
  
  const clonedContent = await openaiService.generateTaskContent(
    sourceIssue.summary,
    category,
    await templateService.getTemplate(category)
  );
  
  await taskService.createIssue({
    project: { key: options.targetProject },
    issuetype: { name: options.issueType || 'Task' },
    summary: `[${category}] ${sourceIssue.summary}`,
    description: clonedContent.description,
    labels: [...(sourceIssue.labels || []), ...clonedContent.labels],
    assignee: options.assignee ? { accountId: options.assignee } : undefined
  });
}
