import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import config from '../config/config.js';
import JiraClient from './clients/jira-client.js';
import GitHubClient from './clients/github-client.js';
import QueryParser from './processors/query-parser.js';
import DataEnricher from './processors/data-enricher.js';
import ResponseGenerator from './processors/response-generator.js';
import { UserNotFoundError, NoActivityError, handleError } from './utils/errors.js';

// Load environment variables
dotenv.config();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize clients
const jiraClient = new JiraClient({
  ...config.jira,
  cache: config.cache
});

const githubClient = new GitHubClient({
  ...config.github,
  cache: config.cache
});

// Initialize processors
const queryParser = new QueryParser();
const dataEnricher = new DataEnricher();
const responseGenerator = new ResponseGenerator(config);

/**
 * Main API endpoint to handle queries
 */
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid query. Please provide a question as a string.'
      });
    }

    console.log(`Processing query: "${query}"`);

    // Parse query
    const parsed = queryParser.parse(query);
    console.log('Parsed query:', parsed);

    if (!parsed.name) {
      return res.status(400).json({
        error: 'Could not extract a name from your query. Please try: "What is [name] working on?"'
      });
    }

    const userName = parsed.name;
    const timeframe = parsed.timeframe || 14; // Default to 2 weeks

    // Fetch data from both platforms concurrently for better performance
    const [jiraUser, githubUser] = await Promise.all([
      jiraClient.findUserByName(userName),
      githubClient.findUser(userName)
    ]);

    // Check if user exists in at least one platform
    if (!jiraUser && !githubUser) {
      const error = new UserNotFoundError(userName);
      const errorResponse = handleError(error);
      const errorMessage = responseGenerator.generateErrorResponse(errorResponse, userName);
      
      return res.json({
        query: query,
        parsed: parsed,
        response: errorMessage,
        error: errorResponse
      });
    }

    // Fetch activity data concurrently
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      jiraUser ? jiraClient.getAssignedIssues(jiraUser.accountId) : Promise.resolve([]),
      jiraUser ? jiraClient.getRecentActivity(jiraUser.accountId, timeframe) : Promise.resolve([]),
      githubUser ? githubClient.getRecentCommits(githubUser.login, timeframe) : Promise.resolve([]),
      githubUser ? githubClient.getActivePullRequests(githubUser.login) : Promise.resolve([]),
      githubUser ? githubClient.getRecentRepositories(githubUser.login, timeframe) : Promise.resolve([])
    ]);

    // Extract results, defaulting to empty arrays on failure
    const [jiraIssues, jiraActivity, githubCommits, githubPRs, githubRepos] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    // Prepare data for enrichment
    const jiraData = {
      user: jiraUser,
      issues: jiraIssues,
      recentActivity: jiraActivity
    };

    const githubData = {
      user: githubUser,
      commits: githubCommits,
      pullRequests: githubPRs,
      repositories: githubRepos
    };

    // Enrich and combine data
    const enrichedData = dataEnricher.enrich(jiraData, githubData, timeframe);

    // Check if there's any activity
    if (enrichedData.metrics.totalItems === 0) {
      const error = new NoActivityError(userName);
      const errorResponse = handleError(error);
      const errorMessage = responseGenerator.generateErrorResponse(errorResponse, userName);
      
      return res.json({
        query: query,
        parsed: parsed,
        response: errorMessage,
        data: enrichedData,
        error: errorResponse
      });
    }

    // Generate response
    const response = await responseGenerator.generateResponse(
      query,
      enrichedData,
      userName
    );

    // Return response
    res.json({
      query: query,
      parsed: parsed,
      response: response,
      data: enrichedData,
      users: {
        jira: jiraUser ? { name: jiraUser.displayName, accountId: jiraUser.accountId } : null,
        github: githubUser ? { name: githubUser.name || githubUser.login, login: githubUser.login } : null
      }
    });

  } catch (error) {
    console.error('Error processing query:', error);
    
    const errorResponse = handleError(error);
    const errorMessage = responseGenerator.generateErrorResponse(errorResponse, 'user');

    res.status(500).json({
      error: errorResponse,
      message: errorMessage
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve frontend
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Team Activity Monitor server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure you've configured your API keys in config/config.js`);
});


