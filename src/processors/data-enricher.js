/**
 * Data Enricher
 * 
 * Creative solutions:
 * - Links GitHub commits to JIRA tickets automatically
 * - Groups related work by project/repository
 * - Calculates activity metrics
 * - Identifies work patterns
 */
class DataEnricher {
  /**
   * Combine and enrich data from JIRA and GitHub
   */
  enrich(jiraData, githubData, timeframe = null) {
    const enriched = {
      jira: {
        activeIssues: jiraData.issues || [],
        recentActivity: jiraData.recentActivity || [],
        summary: this.summarizeJira(jiraData.issues || [])
      },
      github: {
        commits: githubData.commits || [],
        pullRequests: githubData.pullRequests || [],
        repositories: githubData.repositories || [],
        summary: this.summarizeGitHub(githubData)
      },
      linked: this.linkCommitsToTickets(
        githubData.commits || [],
        jiraData.issues || []
      ),
      metrics: this.calculateMetrics(jiraData, githubData, timeframe),
      workPatterns: this.identifyWorkPatterns(jiraData, githubData)
    };

    return enriched;
  }

  /**
   * Summarize JIRA data
   */
  summarizeJira(issues) {
    if (issues.length === 0) {
      return { count: 0, byStatus: {}, byPriority: {}, byType: {} };
    }

    const byStatus = {};
    const byPriority = {};
    const byType = {};

    issues.forEach(issue => {
      byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
      byPriority[issue.priority] = (byPriority[issue.priority] || 0) + 1;
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    });

    return {
      count: issues.length,
      byStatus,
      byPriority,
      byType,
      highPriority: issues.filter(i => 
        ['High', 'Highest', 'Critical'].includes(i.priority)
      ).length
    };
  }

  /**
   * Summarize GitHub data
   */
  summarizeGitHub(githubData) {
    const commits = githubData.commits || [];
    const prs = githubData.pullRequests || [];
    const repos = githubData.repositories || [];

    return {
      commitCount: commits.length,
      prCount: prs.length,
      repositoryCount: repos.length,
      activeRepositories: repos.slice(0, 5).map(r => r.name)
    };
  }

  /**
   * Link GitHub commits to JIRA tickets
   * This is a creative solution that provides valuable insights
   */
  linkCommitsToTickets(commits, issues) {
    const linked = [];
    const issueKeys = new Set(issues.map(i => i.key));

    commits.forEach(commit => {
      commit.jiraTickets.forEach(ticketKey => {
        if (issueKeys.has(ticketKey)) {
          const issue = issues.find(i => i.key === ticketKey);
          linked.push({
            commit: {
              sha: commit.sha,
              message: commit.message,
              date: commit.date,
              url: commit.url,
              repository: commit.repository
            },
            ticket: {
              key: issue.key,
              summary: issue.summary,
              status: issue.status,
              url: issue.url
            }
          });
        }
      });
    });

    return linked;
  }

  /**
   * Calculate activity metrics
   */
  calculateMetrics(jiraData, githubData, timeframe) {
    const commits = githubData.commits || [];
    const issues = jiraData.issues || [];
    const prs = githubData.pullRequests || [];

    // Calculate activity score (weighted)
    const activityScore = 
      (issues.length * 2) +      // Issues are worth more
      (commits.length * 1) +     // Commits
      (prs.length * 3);          // PRs are most valuable

    // Determine activity level
    let activityLevel = 'low';
    if (activityScore > 20) activityLevel = 'high';
    else if (activityScore > 10) activityLevel = 'medium';

    return {
      activityScore,
      activityLevel,
      totalItems: issues.length + commits.length + prs.length,
      timeframe: timeframe || 'recent'
    };
  }

  /**
   * Identify work patterns
   */
  identifyWorkPatterns(jiraData, githubData) {
    const patterns = [];

    const issues = jiraData.issues || [];
    const commits = githubData.commits || [];
    const prs = githubData.pullRequests || [];

    // Pattern: Multiple high-priority items
    const highPriorityCount = issues.filter(i => 
      ['High', 'Highest', 'Critical'].includes(i.priority)
    ).length;
    if (highPriorityCount > 3) {
      patterns.push({
        type: 'multiple_high_priority',
        description: `Working on ${highPriorityCount} high-priority items`,
        impact: 'high'
      });
    }

    // Pattern: Active across many repositories
    const repoCount = new Set(commits.map(c => c.repository)).size;
    if (repoCount > 5) {
      patterns.push({
        type: 'multi_repository',
        description: `Contributing to ${repoCount} different repositories`,
        impact: 'medium'
      });
    }

    // Pattern: Many open PRs
    if (prs.length > 5) {
      patterns.push({
        type: 'many_open_prs',
        description: `Has ${prs.length} open pull requests`,
        impact: 'medium'
      });
    }

    // Pattern: Good commit-to-ticket linking
    const linked = this.linkCommitsToTickets(commits, issues);
    if (linked.length > commits.length * 0.5) {
      patterns.push({
        type: 'good_tracking',
        description: 'Most commits are linked to JIRA tickets',
        impact: 'positive'
      });
    }

    return patterns;
  }
}

export default DataEnricher;


