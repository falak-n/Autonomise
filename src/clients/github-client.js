import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * GitHub Client with rate limit handling and intelligent data processing
 * 
 * Creative solutions:
 * - Automatic rate limit detection and waiting
 * - Concurrent requests for better performance
 * - Links commits to JIRA tickets automatically
 * - Handles organization vs user searches intelligently
 */
class GitHubClient {
  constructor(config) {
    this.apiToken = config.apiToken;
    this.organization = config.organization;
    this.cache = new NodeCache({ stdTTL: config.cache?.ttl || 300 });
    
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${this.apiToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // Track rate limit status
    this.rateLimitRemaining = null;
    this.rateLimitReset = null;
  }

  /**
   * Check and handle rate limits intelligently
   */
  async checkRateLimit() {
    // Skip rate limit check if no token is configured
    if (!this.apiToken || this.apiToken === 'your-github-personal-access-token') {
      return;
    }

    try {
      const response = await this.client.get('/rate_limit');
      this.rateLimitRemaining = response.data.rate.remaining;
      this.rateLimitReset = response.data.rate.reset * 1000; // Convert to ms
      
      if (this.rateLimitRemaining < 10) {
        const waitTime = this.rateLimitReset - Date.now();
        if (waitTime > 0) {
          console.log(`Rate limit low (${this.rateLimitRemaining} remaining). Waiting ${Math.ceil(waitTime/1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error) {
      // Only log warning if it's not an auth error (401)
      if (error.response?.status !== 401) {
        console.warn('Could not check rate limit:', error.message);
      }
      // For 401, the actual request will fail anyway, so we can continue
    }
  }

  /**
   * Make request with rate limit awareness
   */
  async makeRequest(url, params = {}) {
    // Skip rate limit check if no valid token
    if (this.apiToken && this.apiToken !== 'your-github-personal-access-token') {
      await this.checkRateLimit();
    }
    
    try {
      const response = await this.client.get(url, { params });
      
      // Update rate limit info from headers
      if (response.headers['x-ratelimit-remaining']) {
        this.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining']);
      }
      
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Resource not found, return null instead of throwing
      }
      // For 401 (unauthorized), return null instead of throwing
      // This allows the app to continue with JIRA data only
      if (error.response?.status === 401) {
        console.warn(`GitHub API authentication failed. Please check your GitHub token in config/config.js`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Find user by username or email
   * Handles both exact matches and search
   */
  async findUser(username) {
    // Skip if no valid token configured
    if (!this.apiToken || this.apiToken === 'your-github-personal-access-token') {
      console.warn('GitHub API token not configured. Skipping GitHub user lookup.');
      return null;
    }

    const cacheKey = `gh-user:${username.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.makeRequest(`/users/${username}`);
      if (response && response.data) {
        const user = response.data;
        this.cache.set(cacheKey, user);
        return user;
      }
      return null;
    } catch (error) {
      // Try searching if direct lookup fails
      try {
        const searchResponse = await this.makeRequest('/search/users', { q: username });
        if (searchResponse?.data?.items?.length > 0) {
          const user = searchResponse.data.items[0];
          this.cache.set(cacheKey, user);
          return user;
        }
      } catch (searchError) {
        // Only log if it's not an auth error (already handled in makeRequest)
        if (searchError.response?.status !== 401) {
          console.error(`Error finding GitHub user ${username}:`, searchError.message);
        }
      }
      return null;
    }
  }

  /**
   * Get recent commits by user
   * Automatically extracts JIRA ticket references
   */
  async getRecentCommits(username, days = 14) {
    const cacheKey = `commits:${username}:${days}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();

      // Search for commits by author
      const query = `author:${username} author-date:>${sinceStr.split('T')[0]}`;
      const response = await this.makeRequest('/search/commits', {
        q: query,
        per_page: 30,
        sort: 'author-date',
        order: 'desc'
      });

      if (!response?.data?.items) {
        return [];
      }

      const commits = response.data.items.map(item => {
        const commit = item.commit;
        const message = commit.message;
        
        // Extract JIRA ticket references (e.g., "PROJ-123" or "fixes PROJ-456")
        const jiraTicketRegex = /([A-Z]+-\d+)/gi;
        const ticketMatches = message.match(jiraTicketRegex) || [];
        
        return {
          sha: item.sha.substring(0, 7),
          message: message.split('\n')[0], // First line only
          author: commit.author.name,
          date: commit.author.date,
          url: item.html_url,
          repository: item.repository?.full_name || 'unknown',
          jiraTickets: [...new Set(ticketMatches)] // Unique ticket references
        };
      });

      this.cache.set(cacheKey, commits);
      return commits;
    } catch (error) {
      console.error(`Error fetching GitHub commits for ${username}:`, error.message);
      return [];
    }
  }

  /**
   * Get active pull requests
   */
  async getActivePullRequests(username) {
    const cacheKey = `prs:${username}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Search for open PRs by user
      const query = `is:pr is:open author:${username}`;
      const response = await this.makeRequest('/search/issues', {
        q: query,
        per_page: 20
      });

      if (!response?.data?.items) {
        return [];
      }

      // Fetch full PR details concurrently for better performance
      const prPromises = response.data.items.map(item =>
        this.makeRequest(item.pull_request.url.replace('https://api.github.com', ''))
      );

      const prResponses = await Promise.all(prPromises);
      
      const prs = prResponses
        .filter(pr => pr && pr.data)
        .map(pr => ({
          number: pr.data.number,
          title: pr.data.title,
          state: pr.data.state,
          created: pr.data.created_at,
          updated: pr.data.updated_at,
          url: pr.data.html_url,
          repository: pr.data.head.repo?.full_name || 'unknown',
          baseBranch: pr.data.base.ref,
          headBranch: pr.data.head.ref
        }));

      this.cache.set(cacheKey, prs);
      return prs;
    } catch (error) {
      console.error(`Error fetching GitHub PRs for ${username}:`, error.message);
      return [];
    }
  }

  /**
   * Get repositories user has contributed to recently
   */
  async getRecentRepositories(username, days = 30) {
    try {
      const commits = await this.getRecentCommits(username, days);
      const repos = new Map();

      commits.forEach(commit => {
        if (!repos.has(commit.repository)) {
          repos.set(commit.repository, {
            name: commit.repository,
            commitCount: 0,
            lastCommit: commit.date
          });
        }
        const repo = repos.get(commit.repository);
        repo.commitCount++;
        if (new Date(commit.date) > new Date(repo.lastCommit)) {
          repo.lastCommit = commit.date;
        }
      });

      return Array.from(repos.values())
        .sort((a, b) => new Date(b.lastCommit) - new Date(a.lastCommit))
        .slice(0, 10);
    } catch (error) {
      console.error(`Error fetching repositories for ${username}:`, error.message);
      return [];
    }
  }
}

export default GitHubClient;


