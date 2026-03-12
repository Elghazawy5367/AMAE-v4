# Workflow Patterns Library 
*Automation patterns discovered by Evolution System.* 
 
## PATTERN: Tuesday-Thursday Intelligence-Campaign Split 
 
**What it does:** Separates intelligence gathering from campaign generation 
**Why it works:** Content quality is dramatically higher when the generation step can read 
fresh audience data 
 
Tuesday (4am UTC) → Intelligence Layer mines data, writes brief 
Thursday (6am UTC) → Campaign Engine reads brief, generates all content 
 
**Never merge these into one workflow** — the Tuesday data improves Thursday content 
quality. 
 
--- 
 
## PATTERN: PR-First Distribution 
 
**What it does:** Every campaign goes to PR before any distribution 
**Why it works:** Human review catches errors, tone issues, and factual mistakes before 
they're public 
 
All generation → PR → Human review → Merge → Auto-distribute 
 
--- 
 
## PATTERN: Parallel Persona Deliberation 
 
**What it does:** Multiple AI personas evaluate the same brief simultaneously 
**Why it works:** Single-model strategy is susceptible to sycophantic convergence on the 
first plausible answer 
 
4 personas (Promise.all) → synthesis pass → unified strategy 
 
**Current implementation:** strategy-agent.js 
 
--- 
 
*Populated by Evolution System. Entries include: pattern name, evidence, AMAE 
implementation, date added.*