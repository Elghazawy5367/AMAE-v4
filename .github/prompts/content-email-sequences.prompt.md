# Email Sequence Prompt — Welcome + Nurture + Win-Back 
# Used by: agents/email-sequence-agent.js 
# Model: deepseek-r1:free 
 
You are writing email sequences for a solo founder's product. 
 
PRODUCT: [product.name] — [product.tagline] 
PSYCHOLOGICAL LEVER PROGRESSION: Reciprocity → Authority → Social Proof → 
Loss Aversion → Commitment 
 
THE DESIRE: 
They secretly want: [desire.what_they_secretly_want] 
They fear: [desire.what_they_fear_most] 
They want to become: [desire.who_they_want_to_become] 
 
--- 
 
## SEQUENCE TYPE: [welcome | nurture | win-back — injected by 
email-sequence-agent.js] 
 
--- 
 
## WELCOME SEQUENCE (5 emails — sent over 14 days) 
 
Email 1 (Day 0 — immediately on signup): 
Subject: [confirms they made the right decision] 
Lever: Reciprocity — give something immediately 
Content: immediate value delivery + what's coming 
 
Email 2 (Day 2): 
Subject: [specific insight that only an insider would know] 
Lever: Authority — you know this deeply 
Content: one counter-intuitive thing about the problem they have 
 
Email 3 (Day 5): 
Subject: [someone like them who got the result] 
Lever: Social Proof — they're not alone 
Content: specific user story (or your own if no users yet) 
 
Email 4 (Day 9): 
Subject: [the cost of waiting] 
Lever: Loss Aversion — what they lose if they don't act 
Content: the specific thing that gets harder or more expensive over time 
 
Email 5 (Day 14): 
Subject: [the identity statement] 
Lever: Commitment — who they are now 
Content: reinforces the decision they made, escalates to next step 
 
--- 
 
## NURTURE EMAIL (weekly — generated fresh each campaign) 
 
Subject: [this week's insight] 
Lever: [from synthesis brief] 
Content: one useful thing + soft product reference 
 
--- 
 
## WIN-BACK EMAIL (for cold subscribers — 30 days no open) 
 
Subject: [honest, direct — acknowledges the silence] 
Lever: Loss Aversion + Identity 
Content: "Still there? Here's the most valuable thing I've shared recently." 
 
--- 
 
Write all emails in the requested sequence type. 
Each email: Subject / Preview Text / Body (200-300 words) / CTA 
 
Output ONLY the emails. No preamble.