# AMAE Agent Architecture 
## Context for GitHub Copilot and AI coding assistants 
 
This repo is AMAE — an autonomous marketing system running on GitHub Actions. 
 
## Core architecture rules 
 
- All agent files: ESM (import/export), Node 20, native fetch() only — no HTTP libraries 
- All API errors: console.error then process.exit(1) — never swallow errors silently 
- All file paths: relative to process.cwd() — never __dirname or __filename 
- All secrets: process.env.SECRET_NAME only — never hardcoded 
- All file I/O: via lib/file-utils.js helpers — never raw fs calls in agents 
 
## Agent execution order 
 
### Tuesday (weekly-intelligence.yml) 
1. copy-excavator.js — Reddit pain language mining 
2. timing-scout.js — HN + Reddit rising trend velocity 
3. intelligence-synthesizer.js — synthesizes into synthesis-brief.md 
 
### Thursday (weekly-campaign.yml) 
1. memory-agent.js — reads last week's performance 
2. intel-agent.js — reads synthesis-brief.md 
3. strategy-agent.js — 4-persona deliberation → strategy-brief.md 
4. funnel-router.js — tags content by TOFU/MOFU/BOFU 
5. content-factory.js — generates all platform content in parallel 
6. guardrail-agent.js — removes AI-tells, fixes platform rule violations 
7. [PR filed by workflow] 
 
## Critical zones — never modify without founder review 
 
- `config/product-dna.json` the_desire section — founder fills from lived knowledge 
- Any dist-*.js file — read platform ToS before modifying 
- weekly-campaign.yml PR creation — must always create PR, never auto-merge 
- Reddit/Quora distribution — always flagged for human posting