# Prompt Architecture Patterns 
*Discovered by Evolution System from elite marketing repos.* 
 
## PATTERN 1: The Persona Sandwich 
 
**Source:** Discovered from high-performing prompt libraries 
**What it does:** Wraps content generation with persona entry and exit 
 
``` 
ENTER PERSONA: [specific expert identity] 
[role, expertise, perspective, constraints] 
 
TASK: [specific generation task] 
 
EXIT PERSONA: Check your output against this persona's standards before finalizing. 
``` 
 
**AMAE uses this in:** strategy-agent.js (4 personas), intelligence-synthesizer.js 
 
--- 
 
## PATTERN 2: Intelligence-Before-Generation 
 
**What it does:** Always feed intelligence context before generation prompt 
**Rule:** Never ask AI to generate content from nothing — always from evidence 
 
``` 
INTELLIGENCE CONTEXT: 
[what audience said this week] 
[what competitors failed at] 
[what timing windows exist] 
 
GENERATION TASK: 
[now generate content using ONLY the above — do not invent] 
``` 
 
**AMAE uses this in:** content-factory.js (reads synthesis-brief first) 
 
--- 
 
## PATTERN 3: The Verbatim Anchor 
 
**What it does:** Prevents AI from drifting into generic language 
**Rule:** Every content generation prompt must anchor to a specific verbatim phrase 
 
``` 
VERBATIM ANCHOR: "[exact phrase from real audience]" 
Rule: Your output must start with or directly adapt this phrase. 
If you cannot use this phrase, explain why and request a different anchor. 
``` 
 
**AMAE uses this in:** all content platform prompts 
 
--- 
 
## PATTERN 4: Constraint-Before-Task 
 
**What it does:** States all constraints BEFORE the generation task 
**Why it works:** AI attends to early context more than late context 
 
``` 
CONSTRAINTS (apply to everything below): 
[list all hard rules before the task] 
 
TASK: 
[generation task]