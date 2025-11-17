# 🎯 Team Activity Monitor: The Story Behind the Code

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- API tokens for:
  - JIRA (API token from your JIRA instance)
  - GitHub (Personal Access Token)
  - OpenAI (API key) - Optional, falls back to templates if not provided

### Installation

1. **Clone or download this repository**
   ```bash
   cd Autonomise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API credentials**
   
   Copy the example config file:
   ```bash
   cp config/config.example.js config/config.js
   ```
   
   Edit `config/config.js` and add your API credentials:
   ```javascript
   export default {
     jira: {
       baseUrl: 'https://your-company.atlassian.net',
       email: 'your-email@company.com',
       apiToken: 'your-jira-api-token'
     },
     github: {
       apiToken: 'your-github-personal-access-token'
     },
     openai: {
       apiKey: 'your-openai-api-key',  // Optional
       model: 'gpt-3.5-turbo'
     },
     server: {
       port: 3000
     }
   };
   ```

   **OR** use environment variables (recommended):
   ```bash
   export JIRA_BASE_URL="https://your-company.atlassian.net"
   export JIRA_EMAIL="your-email@company.com"
   export JIRA_API_TOKEN="your-jira-api-token"
   export GITHUB_API_TOKEN="your-github-token"
   export OPENAI_API_KEY="your-openai-key"  # Optional
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Getting API Tokens

#### JIRA API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token and use it in your config

#### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `repo` (for private repos)
   - `read:user`
   - `read:org` (if accessing organization repos)
3. Copy the token and use it in your config

#### OpenAI API Key (Optional)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your config (or leave empty to use template responses)

### Testing

Try these example queries:
- "What is John working on these days?"
- "Show me Sarah's recent activity"
- "What has Mike been working on this week?"
- "Show me Lisa's recent pull requests"

---

## The Problem We're Solving

Imagine you're a team lead, and it's Monday morning. Your manager asks: *"Hey, what's Sarah been working on lately? I need to update the client on her progress."*

You think... *"Hmm, let me check JIRA... and GitHub... and maybe Slack... wait, was that last week or this week?"*

**This is the problem we're solving.** In today's distributed, multi-platform world, tracking what team members are actually doing requires jumping between tools, remembering context, and piecing together fragments of information. It's time-consuming, error-prone, and honestly, a bit frustrating.

## Our Mission

Build an AI-powered assistant that understands natural language questions and intelligently combines data from JIRA and GitHub to give you a **human-readable, contextual answer** about what anyone on your team is working on.

But here's the twist: **We're not just building a simple API aggregator.** We're creating something that:
- Understands context (what does "recently" mean? This week? Last 2 weeks?)
- Handles ambiguity gracefully (what if there are two Sarahs?)
- Provides insights, not just data dumps
- Feels conversational, not robotic

---

## 🚀 The Challenge

You have **2 days** to build a working prototype. This isn't about perfection—it's about demonstrating:
- **Rapid problem-solving** under time constraints
- **Creative thinking** when APIs don't behave as expected
- **User empathy** in how you present information
- **Technical judgment** in what to prioritize

---

## 🎨 What Makes This Unique?

### 1. **Smart Query Understanding**
Don't just match keywords. Understand intent:
- "What is John working on?" → Current active work
- "What has Mike committed this week?" → Time-bounded GitHub activity
- "Show me Lisa's recent pull requests" → Specific GitHub activity type
- "What's Sarah been up to?" → General recent activity summary

### 2. **Intelligent Data Fusion**
Combine JIRA tickets and GitHub commits into a coherent narrative:
- Group related work (commits that reference JIRA tickets)
- Identify work patterns (is someone juggling multiple projects?)
- Surface priorities (high-priority tickets vs. low-priority PRs)

### 3. **Graceful Degradation**
What happens when:
- A user doesn't exist in one platform but exists in another?
- APIs are slow or rate-limited?
- Data is incomplete or malformed?
- The user has zero activity?

**Your solution should handle these elegantly, not crash.**

### 4. **Context-Aware Responses**
- If someone has 20 open tickets, summarize intelligently
- If someone has no activity, suggest why (maybe they're on vacation?)
- If data is stale, indicate recency

---

## 🛠️ Technical Approach

### Minimal Viable Stack
- **Backend**: Node.js (Express) or Python (Flask) - your choice
- **Frontend**: Modern HTML/CSS/JS (or CLI if you prefer)
- **AI**: OpenAI API (GPT-3.5+) or Claude API for natural responses
- **APIs**: JIRA REST API + GitHub REST API

### Core Integrations

#### JIRA Integration
- Fetch assigned issues for a user
- Get issue status, priority, and recent updates
- Handle authentication (API token)
- **Challenge**: JIRA's API can be verbose. How do you extract what matters?

#### GitHub Integration
- Get recent commits by user
- Fetch active pull requests
- List repositories user contributed to
- **Challenge**: GitHub returns a lot of data. How do you prioritize relevance?

### Authentication
- Basic API token authentication for both platforms
- **Security Note**: Never hardcode secrets. Use environment variables or config files (excluded from git).

---

## 🎯 Success Criteria

### Must-Have (MVP)
- ✅ User can ask "What is [name] working on?" in natural language
- ✅ System fetches and combines data from both JIRA and GitHub
- ✅ Provides a readable, conversational response
- ✅ Handles at least one error case gracefully (user not found, no activity, etc.)

### Nice-to-Have (Bonus Points)
- 🎁 Multiple question formats supported
- 🎁 Beautiful, intuitive user interface
- 🎁 Additional insights (time estimates, priority levels, work patterns)
- 🎁 Performance optimizations (caching, concurrent API calls)
- 🎁 Smart time-based filtering ("this week", "last month")
- 🎁 Link commits to JIRA tickets automatically

---

## 📁 Suggested Project Structure

```
project/
├── src/
│   ├── clients/
│   │   ├── jira-client.js      # JIRA API integration with smart error handling
│   │   └── github-client.js    # GitHub API integration with rate limit handling
│   ├── processors/
│   │   ├── query-parser.js     # Extract names, timeframes, and intent from queries
│   │   ├── data-enricher.js    # Combine and enrich data from both sources
│   │   └── response-generator.js # Generate human-readable responses
│   ├── utils/
│   │   ├── cache.js            # Optional: caching layer for API responses
│   │   └── errors.js           # Centralized error handling
│   └── server.js               # Main Express/Flask application
├── public/
│   ├── index.html              # Beautiful, modern web interface
│   ├── styles.css              # Clean, responsive styling
│   └── app.js                  # Frontend logic
├── config/
│   ├── config.example.js       # Template for configuration
│   └── .env.example            # Environment variables template
├── tests/
│   └── test-cases.md           # Test scenarios to validate
└── README.md                   # This file
```

---

## 🧪 Test Scenarios

Try these queries and see how your system handles them:

1. **Basic**: "What is John working on these days?"
2. **Time-bound**: "What has Mike been working on this week?"
3. **Specific**: "Show me Sarah's recent pull requests"
4. **Edge Case**: User with no recent activity
5. **Edge Case**: User not found in either platform
6. **Edge Case**: User exists in JIRA but not GitHub (or vice versa)
7. **Complex**: "What's Lisa been up to? Show me her JIRA tickets and commits"

---

## 🎬 Demo Format (15 minutes)

1. **Quick Walkthrough** (3 min)
   - Show your code structure and explain key design decisions
   - Highlight creative solutions you implemented

2. **Live Demonstration** (7 min)
   - Run through the test scenarios above
   - Show how your system handles edge cases
   - Demonstrate the user experience

3. **Technical Challenges** (3 min)
   - What problems did you encounter?
   - How did you solve them?
   - What would you do differently with more time?

4. **Q&A** (2 min)
   - Questions and potential improvements

---

## 💡 Problem-Solving Tips

### When APIs Don't Cooperate
- **Rate Limits**: Implement exponential backoff and caching
- **Slow Responses**: Make concurrent requests where possible
- **Inconsistent Data**: Normalize and validate before processing

### When Queries Are Ambiguous
- Use fuzzy matching for names (handle typos, nicknames)
- Default to reasonable timeframes ("recently" = last 2 weeks)
- Ask clarifying questions if truly ambiguous (or make smart assumptions)

### When Data Is Overwhelming
- Prioritize: Active tickets > Recent commits > Old PRs
- Summarize: "5 high-priority tickets, 12 commits across 3 repos"
- Group: Organize by project or repository

---

## 📚 Resources

### API Documentation
- [JIRA REST API](https://developer.atlassian.com/server/jira/platform/rest-apis/)
- [GitHub REST API](https://docs.github.com/en/rest/quickstart)
- [OpenAI API](https://platform.openai.com/docs/quickstart)

### Getting Started
1. Set up your project structure
2. Get API tokens for JIRA and GitHub
3. Start with one integration (JIRA or GitHub), get it working
4. Add the second integration
5. Build the query parser
6. Integrate AI for response generation
7. Build the UI
8. Test edge cases
9. Polish and document

---

## 🎯 Remember

**This is about problem-solving, not perfection.**

Focus on:
- ✅ Making it work end-to-end
- ✅ Handling errors gracefully
- ✅ Creating a good user experience
- ✅ Writing clean, readable code
- ✅ Communicating your decisions clearly

Don't worry about:
- ❌ Perfect code coverage
- ❌ Enterprise-grade architecture
- ❌ Every possible edge case
- ❌ Production-ready deployment

**Show us how you think, how you solve problems, and how you make trade-offs under time pressure.**

Good luck! 🚀

#   A u t o n o m i s e  
 