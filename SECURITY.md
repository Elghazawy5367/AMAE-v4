# Security Policy 
 
## Protecting Your API Keys 
 
AMAE requires API keys for multiple external services. 
A leaked key can incur costs or compromise your accounts. 
 
## Critical Rules 
 
1. **Never commit `.env`** — it is in `.gitignore` by default. Confirm before every push. 
2. **Use GitHub Secrets** for all CI/CD keys — Settings → Secrets → Actions. 
3. **Rotate immediately** if a key is accidentally committed: 
   - Revoke the key at the provider (OpenRouter, Anthropic, etc.) 
   - Force-push to remove from git history: `git filter-branch` or BFG Repo Cleaner 
   - Add new key to GitHub Secrets 
 
## If You Find a Leaked Key in This Repo 
 
Do not open a public issue. Rotate the key immediately from your provider dashboard. 
The git history does not expire — a leaked key in a commit is compromised even after 
deletion. 
 
## Reporting Security Issues 
 
This is a private automation tool. For security concerns, review your `.env` file 
and GitHub Secrets inventory monthly. 
 
## API Key Inventory 
 
| Key | Provider | Scope | Rotate If | 
|-----|----------|-------|-----------| 
| OPENROUTER_API_KEY | openrouter.ai | AI generation | Committed or shared | 
| ANTHROPIC_API_KEY | console.anthropic.com | Claude fallback | Committed or shared | 
| GITHUB_TOKEN | Auto-injected | Repo read/write | Never — auto-rotates | 
| LINKEDIN_ACCESS_TOKEN | LinkedIn Developer | Page posting | Token expires (60d) | 
| TWITTER_API_KEY | developer.twitter.com | Tweet posting | Committed or shared | 
| IDEOGRAM_API_KEY | ideogram.ai | Image gen | Committed or shared | 
| ELEVENLABS_API_KEY | elevenlabs.io | TTS | Committed or shared |