# Jira OpenAI Chrome Extension

AI-powered Jira task generator.

## Installation

1. Open Chrome Extensions: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension` folder

## Setup

1. Click extension icon
2. Go to Settings tab
3. Enter your OpenAI API key
4. Save settings

## Usage

### Generate Task
1. Click extension icon
2. Enter task description
3. Select category
4. Click "Generate Task"
5. Copy result to Jira

### Analyze Page
1. Open Jira project page
2. Click extension icon
3. Go to Analysis tab
4. Click "Analyze Page" for quick stats
5. Click "Full Project Analysis" for deep analysis

### Full Project Analysis
- Scans ALL tasks in project
- Analyzes categories, labels, terms
- Finds best task examples
- Generates tasks with project context

## Features

- AI task generation (OpenAI GPT)
- Quick page analysis
- Full project scanning
- Context-aware generation
- Multiple categories support
- Copy to clipboard

## Files

- `manifest.json` - Extension configuration
- `popup.html/js/css` - Extension popup UI
- `content.js` - Page analyzer & scanner
- `background.js` - Background service worker
- `welcome.html` - Welcome page
- `icons/` - Extension icons

## Requirements

- Chrome 88+
- OpenAI API key
- Jira account

## License

MIT

