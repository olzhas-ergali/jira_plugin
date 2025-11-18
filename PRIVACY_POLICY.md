# Privacy Policy for Jira Task Generator

**Last Updated:** November 2024

## Introduction

Jira Task Generator ("we", "our", "us") is a Chrome Extension that helps users generate Jira tasks using AI. This Privacy Policy explains how we handle your data.

## Data Collection

**We do NOT collect any personal information.**

The extension operates entirely locally in your browser. We do not:
- Track your usage
- Collect analytics
- Store your data on our servers
- Share your information with third parties

## Data Storage

### Local Storage
- **OpenAI API Key:** Stored locally in `chrome.storage.sync` (encrypted by Chrome)
- **Settings:** Stored locally in your browser
- **No server-side storage**

### Third-Party Services

**OpenAI API:**
- Your API key is used to make requests to OpenAI
- Requests are sent directly from your browser to OpenAI
- We do not intercept or store these requests
- OpenAI's Privacy Policy applies: https://openai.com/policies/privacy-policy

**Jira:**
- The extension interacts with your Jira instance
- All data stays within your Jira environment
- We do not access or store Jira data

## Permissions

The extension requires the following permissions:

- **activeTab:** To interact with Jira pages
- **storage:** To save your OpenAI API key locally
- **scripting:** To inject content scripts on Jira pages
- **tabs:** To detect active Jira tabs
- **contextMenus:** To add right-click menu options

## Data Security

- All data is stored locally in your browser
- API keys are encrypted by Chrome's storage system
- No data transmission to our servers
- No data collection or analytics

## Changes to This Policy

We may update this Privacy Policy. Changes will be posted here with an updated "Last Updated" date.

## Contact

For questions about this Privacy Policy, please contact us through:
- GitHub Issues (if repository is public)
- Email: [your-email@example.com]

## Your Rights

You have the right to:
- Delete your stored data (remove extension)
- Access your data (view in chrome://extensions/)
- Stop using the extension at any time

---

**This extension respects your privacy and operates entirely locally.**

