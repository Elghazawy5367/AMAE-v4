# AMAE — Autonomous Marketing Agentic Engine 
 
AMAE mines your audience's exact pain language from Reddit every week, generates 
complete marketing campaigns using that language, and files a GitHub Pull Request for your 
review. Merge the PR to publish. 
 
Built for solo founders. Runs on GitHub Actions. Costs $0/month to start. 
 
## What it does 
 
**Tuesday 4am UTC** — Intelligence workflow mines Reddit and HN. Finds verbatim pain 
phrases. Writes a synthesis brief. 
 
**Thursday 6am UTC** — Campaign workflow reads the brief. Runs 4-persona strategy 
deliberation. Generates content for all configured platforms. Runs quality gate. Files a Pull 
Request. 
 
**You (Friday, 15 min)** — Read the PR. Edit anything that sounds wrong. Merge. 
 
**Auto (on merge)** — Content posts to all connected platforms. Reddit/Quora/Newsletter 
remain manual — AMAE writes them, you post them. 
 
## Setup in 5 steps 
 
1. Fork this repo 
2. Fill in `config/product-dna.json` — the `the_desire` section is the most important 2 hours 
you will spend 
3. Add `OPENROUTER_API_KEY` to repo Settings → Secrets → Actions 
4. Go to Actions tab → Weekly Intelligence Mining → Run workflow (manual test) 
5. Verify `intelligence/weekly/` files appear — if yes, you are live 
 
## Critical rules 
 
- **Reddit/Quora**: AMAE writes. You post manually. No exceptions. Ban risk is permanent. 
- **Newsletter**: AMAE drafts. You review and send via Beehiiv. Never auto-send. 
- **product-dna.json `the_desire` section**: You fill this in from lived knowledge of your 
audience. AI cannot invent it. 
 
## File structure 
 
``` 
amae/ 
├── config/ 
│   ├── product-dna.json          ← THE ONLY FILE YOU FILL IN 
│   ├── platforms.json            ← 2026 algorithm rules per platform 
│   ├── intelligence-config.json  ← Subreddits and keywords to mine 
│   └── posting-schedule.json     ← Funnel-aware timing 
├── agents/                       ← All AI agents (complete working code) 
├── lib/                          ← API wrappers (Reddit, HN, OpenRouter) 
├── .github/ 
│   ├── workflows/                ← Tuesday + Thursday + merge automations 
│   └── prompts/                  ← Prompt files per agent and platform 
├── intelligence/weekly/          ← Written Tuesday, read Thursday 
├── campaigns/                    ← Generated content per week 
└── memory/                       ← Performance tracking