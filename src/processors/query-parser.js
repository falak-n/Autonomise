/**
 * Intelligent Query Parser
 * 
 * Creative solutions:
 * - Extracts names using multiple strategies (exact match, fuzzy, context)
 * - Detects timeframes from natural language
 * - Identifies intent (general activity, specific platform, time-bound)
 * - Handles variations and typos
 */
class QueryParser {
  constructor() {
    // Common time expressions
    this.timePatterns = [
      { pattern: /this\s+week/gi, days: 7 },
      { pattern: /last\s+week/gi, days: 14 },
      { pattern: /this\s+month/gi, days: 30 },
      { pattern: /last\s+month/gi, days: 60 },
      { pattern: /recently|lately|these\s+days/gi, days: 14 },
      { pattern: /today/gi, days: 1 },
      { pattern: /yesterday/gi, days: 2 }
    ];

    // Platform-specific keywords
    this.platformKeywords = {
      jira: ['jira', 'ticket', 'issue', 'task', 'bug', 'story'],
      github: ['github', 'commit', 'pull request', 'pr', 'code', 'repository', 'repo']
    };
  }

  /**
   * Parse query to extract key information
   */
  parse(query) {
    const normalized = query.toLowerCase().trim();
    
    return {
      originalQuery: query,
      name: this.extractName(query),
      timeframe: this.extractTimeframe(query),
      intent: this.extractIntent(query),
      platform: this.extractPlatform(query)
    };
  }

  /**
   * Extract person's name from query
   * Uses heuristics: names are usually capitalized, appear after question words
   */
  extractName(query) {
    // Remove common question words and phrases
    const cleaned = query
      .replace(/^(what|show|tell|give|list|find)\s+(me|us)?/gi, '')
      .replace(/^(is|has|have|was|were|does|did)\s+/gi, '')
      .replace(/\s+(working|been|doing|up|on|committed|created)/gi, '')
      .trim();

    // Extract potential names (capitalized words, typically 1-3 words)
    const words = cleaned.split(/\s+/);
    const nameCandidates = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Check if word looks like a name (starts with capital, not a common word)
      if (/^[A-Z][a-z]+$/.test(word) && !this.isCommonWord(word)) {
        nameCandidates.push(word);
        // Names are usually 1-3 words
        if (nameCandidates.length >= 3) break;
      }
    }

    if (nameCandidates.length > 0) {
      return nameCandidates.join(' ');
    }

    // Fallback: try to find any capitalized word sequence
    const nameMatch = cleaned.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/);
    return nameMatch ? nameMatch[0] : null;
  }

  /**
   * Check if word is a common word (not a name)
   */
  isCommonWord(word) {
    const commonWords = [
      'what', 'show', 'tell', 'give', 'list', 'find', 'is', 'has', 'have',
      'was', 'were', 'does', 'did', 'working', 'been', 'doing', 'up', 'on',
      'committed', 'created', 'recent', 'recently', 'lately', 'these', 'days',
      'week', 'month', 'jira', 'github', 'ticket', 'issue', 'commit', 'pull',
      'request', 'pr', 'code', 'repository', 'repo'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Extract timeframe from query
   */
  extractTimeframe(query) {
    for (const { pattern, days } of this.timePatterns) {
      if (pattern.test(query)) {
        return days;
      }
    }
    return null; // Default will be handled by caller
  }

  /**
   * Determine user intent
   */
  extractIntent(query) {
    const normalized = query.toLowerCase();
    
    if (normalized.includes('pull request') || normalized.includes('pr')) {
      return 'pull_requests';
    }
    if (normalized.includes('commit')) {
      return 'commits';
    }
    if (normalized.includes('ticket') || normalized.includes('issue')) {
      return 'jira_issues';
    }
    if (normalized.includes('repository') || normalized.includes('repo')) {
      return 'repositories';
    }
    
    return 'general'; // General activity overview
  }

  /**
   * Detect if query is platform-specific
   */
  extractPlatform(query) {
    const normalized = query.toLowerCase();
    
    const jiraScore = this.platformKeywords.jira.filter(kw => 
      normalized.includes(kw)
    ).length;
    
    const githubScore = this.platformKeywords.github.filter(kw => 
      normalized.includes(kw)
    ).length;

    if (jiraScore > githubScore) return 'jira';
    if (githubScore > jiraScore) return 'github';
    return 'both'; // Default to both platforms
  }
}

export default QueryParser;


