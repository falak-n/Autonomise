# Setup Instructions

## Step-by-Step Setup Guide

### 1. Install Node.js
Make sure you have Node.js v16 or higher installed:
```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Credentials

#### Option A: Using config.js (Recommended for development)

1. Copy the example config:
   ```bash
   cp config/config.example.js config/config.js
   ```

2. Edit `config/config.js` with your credentials:
   ```javascript
   export default {
     jira: {
       baseUrl: 'https://your-company.atlassian.net',
       email: 'your-email@company.com',
       apiToken: 'your-jira-api-token-here'
     },
     github: {
       apiToken: 'your-github-token-here'
     },
     openai: {
       apiKey: 'your-openai-key-here',  // Optional
       model: 'gpt-3.5-turbo'
     },
     server: {
       port: 3000
     },
     cache: {
       ttl: 300  // 5 minutes
     }
   };
   ```

#### Option B: Using Environment Variables (Recommended for production)

Create a `.env` file in the root directory:
```env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
GITHUB_API_TOKEN=your-github-token
OPENAI_API_KEY=your-openai-key
PORT=3000
```

### 4. Get Your API Tokens

#### JIRA API Token
1. Log in to your JIRA instance
2. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
3. Click "Create API token"
4. Give it a label (e.g., "Team Activity Monitor")
5. Copy the generated token immediately (you won't see it again!)

#### GitHub Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
   - ✅ `read:org` (Read org and team membership, read org projects) - if needed
5. Click "Generate token"
6. Copy the token immediately

#### OpenAI API Key (Optional)
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key immediately

**Note:** If you don't provide an OpenAI API key, the system will use template-based responses instead of AI-generated ones.

### 5. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 7. Test It Out

Try asking:
- "What is [team-member-name] working on these days?"
- "Show me [name]'s recent activity"
- "What has [name] been working on this week?"

## Troubleshooting

### "Cannot find module" errors
- Make sure you ran `npm install`
- Check that you're in the project root directory

### "API authentication failed"
- Double-check your API tokens in `config/config.js`
- For JIRA: Make sure you're using your email (not username) and the correct API token
- For GitHub: Verify your token has the correct scopes

### "User not found" errors
- Make sure the team member exists in JIRA/GitHub
- Try using their exact display name or GitHub username
- Check that your API tokens have access to the relevant organizations/repositories

### Port already in use
- Change the port in `config/config.js` or set `PORT` environment variable
- Or stop the process using port 3000

### CORS errors (if accessing from different domain)
- The app is configured to serve from the same origin
- If needed, add CORS middleware in `src/server.js`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `config/config.js` to version control
- Never commit `.env` files
- The `.gitignore` file is configured to exclude these files
- Keep your API tokens secure and rotate them regularly

## Next Steps

- Read the main [README.md](README.md) for more details about the project
- Check out the test scenarios in the README
- Customize the UI in `public/` directory
- Extend functionality in `src/` directory


