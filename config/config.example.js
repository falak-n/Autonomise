// Copy this file to config.js and fill in your actual credentials
// Make sure config.js is in .gitignore!

export default {
  jira: {
    baseUrl: 'https://your-jira-instance.atlassian.net',
    email: 'your-email@example.com',
    apiToken: 'your-jira-api-token'
  },
  github: {
    apiToken: 'your-github-personal-access-token',
    // Optional: specify organization or user to search within
    organization: null
  },
  openai: {
    apiKey: 'your-openai-api-key',
    model: 'gpt-3.5-turbo'
  },
  server: {
    port: 3000
  },
  cache: {
    ttl: 300 // Cache API responses for 5 minutes
  }
};


