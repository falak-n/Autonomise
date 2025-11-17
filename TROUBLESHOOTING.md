# Troubleshooting Guide

## Common Issues and Solutions

### 🔴 GitHub API 401 Errors

**Error:** `Request failed with status code 401`

**Causes:**
- GitHub API token is missing or not configured
- GitHub API token is invalid or expired
- GitHub API token doesn't have required permissions

**Solutions:**

1. **Check your GitHub token in `config/config.js`:**
   ```javascript
   github: {
     apiToken: 'your-actual-github-token-here'  // Make sure this is a real token
   }
   ```

2. **Create a new GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select these scopes:
     - ✅ `repo` (for private repos)
     - ✅ `read:user`
     - ✅ `read:org` (if accessing organization repos)
   - Copy the token and update `config/config.js`

3. **The app will now work with JIRA-only data if GitHub token is missing:**
   - The app gracefully handles missing GitHub tokens
   - You'll still get JIRA data even if GitHub fails
   - Check console for warnings about missing tokens

---

### 🔴 JIRA API 410 Errors

**Error:** `Request failed with status code 410` (Gone)

**Causes:**
- Invalid JQL query format
- AccountId format issues in JQL queries
- API endpoint deprecation

**Solutions:**

1. **Fixed in latest version:**
   - The JQL queries now use proper quotes around accountId
   - Changed from: `assignee = 712020:...`
   - Changed to: `assignee = "712020:..."`

2. **If you still see 410 errors:**
   - Check your JIRA baseUrl is correct
   - Verify your email and API token are correct
   - Make sure your JIRA instance supports REST API v3

3. **The app now handles 410 errors gracefully:**
   - Returns empty array instead of crashing
   - Continues with other data sources (GitHub)
   - Shows appropriate error messages to users

---

### 🟡 JIRA User Not Found

**Error:** User exists but can't be found

**Solutions:**

1. **Try different name formats:**
   - Full name: "John Doe"
   - Display name: "John"
   - Email: "john@company.com"

2. **Check JIRA user search:**
   - The app uses JIRA's user search API
   - Make sure the user exists in your JIRA instance
   - Verify your API token has permission to search users

---

### 🟡 GitHub User Not Found

**Error:** GitHub user can't be found

**Solutions:**

1. **Use GitHub username, not display name:**
   - ✅ Correct: "octocat" (username)
   - ❌ Wrong: "The Octocat" (display name)

2. **Check if user exists:**
   - Visit: `https://github.com/username`
   - Make sure the username is correct

3. **If using organization repos:**
   - Make sure your GitHub token has `read:org` permission
   - Verify the user is a member of the organization

---

### 🟡 No Activity Found

**Error:** "User doesn't have any recent activity"

**Solutions:**

1. **Check timeframes:**
   - Default is 14 days
   - Try queries like "What has [name] been working on this week?"

2. **Verify user has activity:**
   - Check JIRA for assigned issues
   - Check GitHub for recent commits/PRs
   - Make sure the activity is within the timeframe

3. **Check API permissions:**
   - JIRA: Make sure you can see the user's issues
   - GitHub: Make sure you have access to the repositories

---

### 🟡 Server Won't Start

**Error:** Port already in use or other startup errors

**Solutions:**

1. **Change the port:**
   ```javascript
   // In config/config.js
   server: {
     port: 3001  // Use a different port
   }
   ```

2. **Kill the process using port 3000:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill
   ```

3. **Check for syntax errors:**
   - Make sure `config/config.js` has valid JavaScript
   - Check for missing commas or brackets

---

### 🟡 Rate Limiting

**Error:** API rate limit exceeded

**Solutions:**

1. **The app handles rate limits automatically:**
   - GitHub: Automatically waits when rate limit is low
   - JIRA: Retries with exponential backoff

2. **If you hit limits frequently:**
   - Increase cache TTL in `config/config.js`:
     ```javascript
     cache: {
       ttl: 600  // Cache for 10 minutes instead of 5
     }
     ```

3. **For GitHub:**
   - Use authenticated requests (you already are)
   - Authenticated requests have higher rate limits

---

## Debugging Tips

### Enable Verbose Logging

Check the server console for detailed error messages. The app logs:
- Query parsing results
- API request status
- Error details
- User lookup results

### Test API Connections Separately

1. **Test JIRA:**
   ```bash
   curl -u "your-email@company.com:your-api-token" \
     "https://your-company.atlassian.net/rest/api/3/myself"
   ```

2. **Test GitHub:**
   ```bash
   curl -H "Authorization: token your-github-token" \
     "https://api.github.com/user"
   ```

### Check Browser Console

Open browser DevTools (F12) and check:
- Network tab for API request/response details
- Console tab for JavaScript errors
- Application tab for stored data

---

## Getting Help

If you're still experiencing issues:

1. **Check the error message** in the server console
2. **Verify your API tokens** are correct and have proper permissions
3. **Test with a simple query** like "What is [your-name] working on?"
4. **Check the logs** for specific error codes and messages

---

## Recent Fixes (Latest Version)

✅ **GitHub 401 errors** - Now handled gracefully, app continues with JIRA data
✅ **JIRA 410 errors** - Fixed JQL query format, added proper error handling
✅ **Partial failures** - App now works even if one API fails
✅ **Better error messages** - More helpful error messages in console and UI

