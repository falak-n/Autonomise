import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * JIRA Client with intelligent error handling and caching
 * 
 * Creative solutions:
 * - Automatic retry with exponential backoff
 * - Smart caching to reduce API calls
 * - Normalizes data structure for easier processing
 * - Handles partial failures gracefully
 */
class JiraClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.cache = new NodeCache({ stdTTL: config.cache?.ttl || 300 });
    
    // Create authenticated axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.email,
        password: this.apiToken
      },
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Retry logic with exponential backoff
   * Handles rate limits and temporary failures
   */
  async retryRequest(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // If rate limited, wait longer
        if (error.response?.status === 429) {
          const waitTime = Math.pow(2, i) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (error.response?.status >= 500) {
          // Server error, retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        } else {
          // Client error, don't retry
          throw error;
        }
      }
    }
  }

  /**
   * Search for users by name (fuzzy matching)
   * Handles cases where exact name doesn't match
   */
  async findUserByName(name) {
    const cacheKey = `user:${name.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.retryRequest(() =>
        this.client.get('/rest/api/3/user/search', {
          params: { query: name }
        })
      );

      if (response.data && response.data.length > 0) {
        // Return the first match (could be enhanced with fuzzy matching)
        const user = response.data[0];
        this.cache.set(cacheKey, user);
        return user;
      }
      return null;
    } catch (error) {
      console.error(`Error finding JIRA user ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Get assigned issues for a user
   * Returns normalized, enriched data
   */
  async getAssignedIssues(accountId, maxResults = 50) {
    const cacheKey = `issues:${accountId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Use quotes around accountId for proper JQL syntax
      const jql = `assignee = "${accountId}" AND status != Done ORDER BY updated DESC`;
      
      const response = await this.retryRequest(() =>
        this.client.get('/rest/api/3/search', {
          params: {
            jql,
            maxResults,
            fields: 'summary,status,priority,created,updated,issuetype,project'
          }
        })
      );

      const issues = response.data.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'None',
        type: issue.fields.issuetype.name,
        project: issue.fields.project.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        url: `${this.baseUrl}/browse/${issue.key}`
      }));

      this.cache.set(cacheKey, issues);
      return issues;
    } catch (error) {
      console.error(`Error fetching JIRA issues for ${accountId}:`, error.message);
      if (error.response?.status === 404 || error.response?.status === 410) {
        // 404 = not found, 410 = gone (deprecated endpoint or invalid query)
        // Return empty array instead of throwing
        return [];
      }
      // For other errors, still throw to let caller handle
      throw error;
    }
  }

  /**
   * Get recent activity/updates for a user
   * Shows what they've been working on recently
   */
  async getRecentActivity(accountId, days = 14) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];

      // Use quotes around accountId for proper JQL syntax
      const jql = `assignee = "${accountId}" AND updated >= "${sinceStr}" ORDER BY updated DESC`;
      
      const response = await this.retryRequest(() =>
        this.client.get('/rest/api/3/search', {
          params: {
            jql,
            maxResults: 20,
            fields: 'summary,status,priority,updated,issuetype'
          }
        })
      );

      return response.data.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'None',
        type: issue.fields.issuetype.name,
        updated: issue.fields.updated,
        url: `${this.baseUrl}/browse/${issue.key}`
      }));
    } catch (error) {
      console.error(`Error fetching recent JIRA activity:`, error.message);
      return [];
    }
  }
}

export default JiraClient;


