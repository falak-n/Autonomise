import OpenAI from 'openai';

/**
 * Response Generator with AI Integration
 * 
 * Creative solutions:
 * - Uses OpenAI API for natural, conversational responses
 * - Falls back to template-based responses if AI is unavailable
 * - Formats data in a human-readable way
 * - Handles edge cases gracefully
 */
class ResponseGenerator {
  constructor(config) {
    this.openai = config?.openai?.apiKey 
      ? new OpenAI({ apiKey: config.openai.apiKey })
      : null;
    this.model = config?.openai?.model || 'gpt-3.5-turbo';
    this.useAI = !!this.openai;
  }

  /**
   * Generate response using AI or templates
   */
  async generateResponse(query, enrichedData, userName) {
    if (this.useAI) {
      try {
        return await this.generateAIResponse(query, enrichedData, userName);
      } catch (error) {
        console.warn('AI generation failed, falling back to template:', error.message);
        return this.generateTemplateResponse(query, enrichedData, userName);
      }
    } else {
      return this.generateTemplateResponse(query, enrichedData, userName);
    }
  }

  /**
   * Generate response using OpenAI API
   */
  async generateAIResponse(query, enrichedData, userName) {
    const prompt = this.buildPrompt(query, enrichedData, userName);
    
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides clear, concise summaries of team member activities. Be conversational and highlight the most important information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  }

  /**
   * Build prompt for AI
   */
  buildPrompt(query, enrichedData, userName) {
    const jiraSummary = enrichedData.jira.summary;
    const githubSummary = enrichedData.github.summary;
    const linked = enrichedData.linked;
    const metrics = enrichedData.metrics;
    const patterns = enrichedData.workPatterns;

    let prompt = `Based on the following data, provide a natural, conversational answer to: "${query}"\n\n`;
    prompt += `Person: ${userName}\n\n`;

    // JIRA data
    if (jiraSummary.count > 0) {
      prompt += `JIRA Activity:\n`;
      prompt += `- ${jiraSummary.count} active issues\n`;
      if (jiraSummary.highPriority > 0) {
        prompt += `- ${jiraSummary.highPriority} high-priority items\n`;
      }
      prompt += `- Status breakdown: ${JSON.stringify(jiraSummary.byStatus)}\n`;
      
      if (enrichedData.jira.activeIssues.length > 0) {
        prompt += `\nKey issues:\n`;
        enrichedData.jira.activeIssues.slice(0, 5).forEach(issue => {
          prompt += `- ${issue.key}: ${issue.summary} (${issue.status}, ${issue.priority} priority)\n`;
        });
      }
    } else {
      prompt += `JIRA: No active issues found\n`;
    }

    // GitHub data
    prompt += `\nGitHub Activity:\n`;
    prompt += `- ${githubSummary.commitCount} recent commits\n`;
    prompt += `- ${githubSummary.prCount} open pull requests\n`;
    prompt += `- Active in ${githubSummary.repositoryCount} repositories\n`;
    
    if (githubSummary.activeRepositories.length > 0) {
      prompt += `- Repositories: ${githubSummary.activeRepositories.join(', ')}\n`;
    }

    if (enrichedData.github.commits.length > 0) {
      prompt += `\nRecent commits:\n`;
      enrichedData.github.commits.slice(0, 5).forEach(commit => {
        prompt += `- ${commit.message} (${commit.repository})\n`;
      });
    }

    if (enrichedData.github.pullRequests.length > 0) {
      prompt += `\nOpen PRs:\n`;
      enrichedData.github.pullRequests.slice(0, 5).forEach(pr => {
        prompt += `- ${pr.title} (${pr.repository})\n`;
      });
    }

    // Linked work
    if (linked.length > 0) {
      prompt += `\nLinked work (commits connected to JIRA tickets): ${linked.length} items\n`;
    }

    // Patterns
    if (patterns.length > 0) {
      prompt += `\nNotable patterns:\n`;
      patterns.forEach(pattern => {
        prompt += `- ${pattern.description}\n`;
      });
    }

    prompt += `\nProvide a friendly, conversational summary that answers the question naturally.`;

    return prompt;
  }

  /**
   * Generate template-based response (fallback)
   */
  generateTemplateResponse(query, enrichedData, userName) {
    const jiraSummary = enrichedData.jira.summary;
    const githubSummary = enrichedData.github.summary;
    const linked = enrichedData.linked;
    const metrics = enrichedData.metrics;

    let response = `Here's what ${userName} has been working on:\n\n`;

    // JIRA section
    if (jiraSummary.count > 0) {
      response += `📋 **JIRA Activity** (${jiraSummary.count} active issues):\n`;
      
      if (jiraSummary.highPriority > 0) {
        response += `⚠️ ${jiraSummary.highPriority} high-priority items\n`;
      }

      // Show status breakdown
      const statusEntries = Object.entries(jiraSummary.byStatus);
      if (statusEntries.length > 0) {
        response += `Status: ${statusEntries.map(([status, count]) => `${status} (${count})`).join(', ')}\n`;
      }

      // List key issues
      if (enrichedData.jira.activeIssues.length > 0) {
        response += `\nKey issues:\n`;
        enrichedData.jira.activeIssues.slice(0, 5).forEach(issue => {
          response += `  • ${issue.key}: ${issue.summary} - ${issue.status} (${issue.priority})\n`;
        });
      }
      response += `\n`;
    } else {
      response += `📋 **JIRA**: No active issues found\n\n`;
    }

    // GitHub section
    response += `💻 **GitHub Activity**:\n`;
    response += `  • ${githubSummary.commitCount} recent commits\n`;
    response += `  • ${githubSummary.prCount} open pull requests\n`;
    response += `  • Active in ${githubSummary.repositoryCount} repositories\n`;

    if (githubSummary.activeRepositories.length > 0) {
      response += `  • Repositories: ${githubSummary.activeRepositories.join(', ')}\n`;
    }

    // Recent commits
    if (enrichedData.github.commits.length > 0) {
      response += `\nRecent commits:\n`;
      enrichedData.github.commits.slice(0, 5).forEach(commit => {
        response += `  • ${commit.message} (${commit.repository})\n`;
      });
    }

    // Open PRs
    if (enrichedData.github.pullRequests.length > 0) {
      response += `\nOpen pull requests:\n`;
      enrichedData.github.pullRequests.slice(0, 5).forEach(pr => {
        response += `  • ${pr.title} (${pr.repository})\n`;
      });
    }

    // Linked work
    if (linked.length > 0) {
      response += `\n🔗 **Linked Work**: ${linked.length} commits are connected to JIRA tickets, showing good tracking!\n`;
    }

    // Activity level
    response += `\n📊 **Activity Level**: ${metrics.activityLevel} (${metrics.totalItems} total items)`;

    // Work patterns
    if (enrichedData.workPatterns.length > 0) {
      response += `\n\n💡 **Notable Patterns**:\n`;
      enrichedData.workPatterns.forEach(pattern => {
        response += `  • ${pattern.description}\n`;
      });
    }

    // Handle no activity case
    if (metrics.totalItems === 0) {
      response = `${userName} doesn't appear to have any recent activity on JIRA or GitHub. `;
      response += `This could mean they're on vacation, working on a different project, or the data might not be synced yet.`;
    }

    return response;
  }

  /**
   * Generate error response
   */
  generateErrorResponse(error, userName) {
    if (error.type === 'USER_NOT_FOUND') {
      return `I couldn't find "${userName}" in JIRA or GitHub. Please check the spelling or try a different name.`;
    }
    
    if (error.type === 'NO_ACTIVITY') {
      return `${userName} doesn't have any recent activity to show. They might be on vacation or working on something else.`;
    }

    if (error.type === 'API_ERROR') {
      return `I encountered an issue fetching data: ${error.message}. Please try again in a moment.`;
    }

    return `Sorry, I encountered an error: ${error.message}. Please try again.`;
  }
}

export default ResponseGenerator;


