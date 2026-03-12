# GitHub Copilot Instructions for AMAE 
<!-- These instructions are read by GitHub Copilot when working in this repo --> 
<!-- They are also read by Claude Code, Cursor, Windsurf, and any agent with file context 
--> 
 
## What this repo is 
 
AMAE is an Autonomous Marketing Agentic Engine. It mines Reddit and HackerNews 
weekly for 
verbatim audience pain language, generates complete marketing campaigns using that 
language, 
and files Pull Requests for founder review. It runs on GitHub Actions at $0/month to start. 
 
## Architecture rules — follow these in every file you touch 
 
- All JavaScript: ESM modules (import/export). Never CommonJS (require). 
- Node.js version: 20+. Use Node 20 features freely. 
- HTTP calls: native fetch() ONLY. Never axios, node-fetch, got, or any HTTP library. 
- File I/O: always use helpers from lib/file-utils.js. Never raw fs calls in agents. 
- Secrets: process.env.SECRET_NAME only. Never hardcoded. Never .env in production. 
- Error handling: console.error(message, err.message) then process.exit(1). Never swallow 
errors. 
- Paths: relative to process.cwd(). Never __dirname or __filename in ESM context. 
- AI calls: always through lib/openrouter.js. Never direct fetch to AI APIs in agents. 
 
## The five systems — understand before modifying 
 
- System 1 (Campaign Engine): agents/intel-agent.js → strategy-agent.js → funnel-router.js 
→ content-factory.js → guardrail-agent.js → content-mirror-agent.js 
- System 2 (Intelligence Layer): agents/copy-excavator.js → timing-scout.js → 
competitor-autopsist.js → audience-locator.js → hook-miner.js → intelligence-synthesizer.js 
- System 3 (GitHub Platform): agents/aeo-optimizer.js, dist-github.js, profile-readme-agent.js, 
citation-tracker.js 
- System 4 (Evolution): agents/scout-agent.js → twin-agent.js → evolution-agent.js 
- System 5 (Distribution): agents/distributor.js → agents/dist-*.js 
 
## Critical rules — never violate 
 
1. Reddit/Quora: AMAE WRITES, human POSTS. Never auto-post to Reddit. dist-reddit.js 
writes a draft file only. 
2. Newsletter: AMAE DRAFTS, human SENDS. dist-beehiiv.js creates a draft via API. Never 
triggers send. 
3. Campaign PRs: never auto-merge. Always require human review. 
4. product-dna.json: never modify programmatically. It is founder input only. 
5. Evolution PRs: always require human review. Never auto-merge evolution proposals. 
 
## File naming conventions 
 
- agents/: verb-noun.js (copy-excavator.js, not copyExcavator.js) 
- lib/: noun-type.js (reddit-api.js, file-utils.js) 
- dist-agents: dist-platform.js (dist-linkedin.js, dist-twitter-x.js) 
- prompts: platform.prompt.md or agent-name.prompt.md 
- configs: noun-noun.json (product-dna.json, posting-schedule.json) 
 
## When adding a new platform distributor 
 
1. Create agents/dist-[platform].js 
2. Add to agents/distributor.js routing table 
3. Add API key to .env.example with documentation comment 
4. Add platform rules to config/platforms.json 
5. Add corresponding content prompt to .github/prompts/content-[platform].prompt.md 
6. Add platform flag to config/posting-schedule.json 
 
## When the guardrail fails to fix content after 2 passes 
 
Flag the file in guardrail-log.md with: `HUMAN REVIEW REQUIRED — 2 rewrite passes 
failed` 
Never loop more than 2 times. Never crash the workflow over content quality. 
 
## Model selection (2026 free tier) 
 
Use lib/openrouter.js MODELS constants: 
- MODELS.REASONING (deepseek-r1:free) — synthesis, strategy, complex analysis 
- MODELS.FAST (deepseek-chat-v3-0324:free) — content generation, fast tasks 
- MODELS.CLASSIFIER (llama-3.3-70b:free) — classification, guardrail, quick decisions 
- MODELS.FALLBACK (gemini-2.0-flash-thinking-exp:free) — when others are rate-limited 
 
## Data flow — read this before modifying any agent 
 
``` 
Tuesday:  Reddit/HN → copy-ammunition.md + timing-windows.json + 
competitor-failures.md 
          → audience-map.json + hook-recommendation.json 
          → synthesis-brief.md [COMMITTED TO REPO] 
 
Thursday: synthesis-brief.md → intel-brief.md 
          → strategy-brief.md (4 personas in parallel) 
          → funnel-map.json 
          → campaigns/[WEEK]/text/*.md (all platforms) 
          → campaigns/[WEEK]/assets/* (images, audio) 
          → [PR FILED — never auto-merged] 
 
On merge: → all dist-*.js run → content posted 
          → dist-github.js → blog deployed 
          → profile-readme-agent.js → README updated