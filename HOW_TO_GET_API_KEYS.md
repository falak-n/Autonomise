# How to Get API Keys and Configuration

## 🔑 JIRA Configuration

### 1. JIRA Base URL
**What it is:** Your JIRA instance URL

**How to find it:**
- Look at your browser's address bar when you're logged into JIRA
- It usually looks like: `https://yourcompany.atlassian.net`
- Or: `https://yourcompany.jira.com`
- Or: `https://jira.yourcompany.com`

**Example:**
- If you access JIRA at `https://acme.atlassian.net`, then your baseUrl is `https://acme.atlassian.net`

### 2. JIRA Email
**What it is:** The email address you use to log into JIRA

**How to find it:**
- This is simply your JIRA login email
- It's the email address associated with your Atlassian account
- **Important:** Use your email, NOT your username

**Example:**
- `john.doe@company.com`

### 3. JIRA API Token
**What it is:** A secure token that allows the application to access JIRA on your behalf

**How to create it:**

1. **Go to Atlassian Account Settings:**
   - Visit: https://id.atlassian.com/manage-profile/security/api-tokens
   - Or: Log into JIRA → Click your profile picture → Account Settings → Security → API tokens

2. **Create a new token:**
   - Click the **"Create API token"** button
   - Give it a descriptive label (e.g., "Team Activity Monitor" or "Activity Bot")
   - Click **"Create"**

3. **Copy the token:**
   - ⚠️ **IMPORTANT:** Copy the token immediately - you won't be able to see it again!
   - It will look like: `ATATT3xFfGF0...` (a long string of characters)
   - If you lose it, you'll need to create a new one

4. **Store it securely:**
   - Paste it into your `config/config.js` file
   - Never share it or commit it to version control

**Visual Guide:**
```
Atlassian Account → Security → API tokens → Create API token
```

---

## 🐙 GitHub Configuration

### GitHub Personal Access Token

**How to create it:**

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Your Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate new token:**
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Give it a descriptive name (e.g., "Team Activity Monitor")

3. **Select scopes (permissions):**
   - ✅ **`repo`** - Full control of private repositories (needed to read commits, PRs)
   - ✅ **`read:user`** - Read user profile data
   - ✅ **`read:org`** - Read org and team membership (if accessing organization repos)
   - ✅ **`read:public_repo`** - Access public repositories (if you only need public repos)

4. **Generate and copy:**
   - Scroll down and click **"Generate token"**
   - ⚠️ **IMPORTANT:** Copy the token immediately - you won't see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxx` (starts with `ghp_`)

5. **Store it securely:**
   - Paste it into your `config/config.js` file

**Note:** If you're only accessing public repositories, you might not need the `repo` scope, but it's recommended for full functionality.

---

## 🤖 OpenAI Configuration (Optional)

### OpenAI API Key

**How to create it:**

1. **Go to OpenAI Platform:**
   - Visit: https://platform.openai.com/
   - Sign up or log in

2. **Navigate to API Keys:**
   - Go to: https://platform.openai.com/api-keys
   - Or: Dashboard → API keys

3. **Create new key:**
   - Click **"Create new secret key"**
   - Give it a name (e.g., "Team Activity Monitor")
   - Click **"Create secret key"**

4. **Copy the key:**
   - ⚠️ **IMPORTANT:** Copy the key immediately - you won't see it again!
   - It will look like: `sk-xxxxxxxxxxxxxxxxxxxx` (starts with `sk-`)

5. **Store it securely:**
   - Paste it into your `config/config.js` file

**Note:** 
- OpenAI API usage is **paid** (pay-as-you-go)
- If you don't provide an OpenAI key, the app will use template-based responses instead
- Template responses work fine, but AI responses are more natural and conversational

---

## 📝 Example Configuration

After getting all your keys, your `config/config.js` should look like this:

```javascript
export default {
  jira: {
    baseUrl: 'https://mycompany.atlassian.net',  // Your JIRA URL
    email: 'john.doe@company.com',                // Your JIRA email
    apiToken: 'ATATT3xFfGF0...'                   // Your JIRA API token
  },
  github: {
    apiToken: 'ghp_xxxxxxxxxxxxxxxxxxxx',         // Your GitHub token
    organization: null                             // Optional: 'my-org' if needed
  },
  openai: {
    apiKey: 'sk-xxxxxxxxxxxxxxxxxxxx',            // Your OpenAI key (optional)
    model: 'gpt-3.5-turbo'
  },
  server: {
    port: 3000
  },
  cache: {
    ttl: 300
  }
};
```

---

## 🔒 Security Best Practices

1. **Never commit `config/config.js` to git** - It's already in `.gitignore`
2. **Never share your API tokens** - They give full access to your accounts
3. **Use environment variables in production** - More secure than config files
4. **Rotate tokens regularly** - Especially if you suspect they've been compromised
5. **Use minimal required permissions** - Only grant the scopes you need

---

## 🆘 Troubleshooting

### "JIRA authentication failed"
- Double-check your email (use email, not username)
- Verify your API token is correct
- Make sure your JIRA baseUrl is correct (include `https://`)

### "GitHub authentication failed"
- Verify your token starts with `ghp_`
- Check that you selected the correct scopes
- Make sure the token hasn't expired

### "User not found"
- Make sure the team member exists in JIRA/GitHub
- Try using their exact display name or GitHub username
- Check that your API tokens have access to the relevant organizations

---

## 💡 Quick Reference Links

- **JIRA API Tokens:** https://id.atlassian.com/manage-profile/security/api-tokens
- **GitHub Tokens:** https://github.com/settings/tokens
- **OpenAI API Keys:** https://platform.openai.com/api-keys


