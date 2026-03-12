# Scout Agent Prompt — Repo Signal Evaluation 
# Used by: agents/scout-agent.js (not an AI call — pure algorithmic scoring) 
# This file documents the signal logic for human reference 
 
## Scout Signal Weights 
 
The scout-agent.js uses pure algorithmic scoring (no AI call). 
This file documents the decision logic. 
 
### High-Value File Detection (+2 points each) 
prompts/ directory, PROMPTS.md, hooks.md, frameworks/ directory, 
results/ directory, case-studies/ directory, experiments/ directory, 
.github/prompts/ directory, playbooks/ directory, PLAYBOOK.md 
 
### Commit Signal Detection (+3 points each) 
Messages containing: "improved engagement", "a/b test", "viral hook", 
"algorithm update", "prompt optimization", "10x", "results:", "increased by" 
 
### Star Thresholds 
50+ stars: qualifies for candidate pool 
500+ stars: +2 signal score bonus 
 
### Freshness Thresholds 
Updated < 14 days ago: +3 points 
Updated 14-30 days ago: +2 points 
Updated 30-90 days ago: +1 point 
Updated > 180 days: disqualified (abandoned) 
 
### Minimum Signal Score to Advance to Twin Agent: 3