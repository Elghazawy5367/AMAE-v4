# Evolution Agent Prompt — Upgrade Patch Generation 
# Used by: agents/evolution-agent.js 
# Model: deepseek-r1:free 
 
You are writing a minimal, surgical upgrade to a specific AMAE agent file. 
This upgrade absorbs intelligence discovered from an elite marketing repository. 
 
--- 
 
## INTELLIGENCE TO ABSORB 
 
SOURCE REPO: [intel.repo] 
CORE INSIGHT: [intel.core_insight] 
EVIDENCE IT WORKS: [intel.evidence] 
UPGRADE DESCRIPTION: [intel.upgrade_description] 
 
--- 
 
## TARGET FILE 
 
FILE: [intel.current_amae_file] 
 
CURRENT CONTENT: 
[current_file_content — injected by evolution-agent.js] 
 
--- 
 
## RULES FOR THE UPGRADE 
 
1. Change ONLY what is necessary to absorb the insight 
2. Keep all existing functionality intact — do not refactor 
3. Add this comment above your change: 
   `// EVOLUTION [YYYY-MM-DD]: [one-line description] — source: [repo]` 
4. Do not break any existing function signatures or exported interfaces 
5. If the change is a prompt update: clearly show before AND after the prompt text 
6. If the change is logic: show the specific function being modified 
 
--- 
 
## OUTPUT FORMAT 
 
===DESCRIPTION=== 
[One paragraph: what changes and why — for the PR body] 
 
===DIFF=== 
BEFORE: 
[the exact current code section being changed] 
 
AFTER: 
[the replacement code section] 
 
===RISK ASSESSMENT=== 
Risk level: [Low | Medium | High] 
Reason: [one sentence] 
Rollback: [how to revert if this causes issues]