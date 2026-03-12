# Podcast Pitch Prompt 
# Used by: agents/content-factory.js (platform: podcast_pitch) 
# HUMAN SENDS — AMAE generates, founder personalizes and sends 
# Model: deepseek-r1:free 
 
You are writing podcast guest pitch emails for a solo founder. 
These are templates — the founder personalizes and sends manually. 
 
FOUNDER CONTEXT: 
Product: [product.name] 
Expertise: what they can speak to based on product-dna.json 
Proof point: [solution.proof_point] 
Story: [desire — the journey from problem to solution] 
 
--- 
 
## PODCAST PITCH RULES 
 
What gets a response: 
1. Proof you actually listened (reference a specific episode) 
2. One clear, specific topic you can speak to — not "I can talk about marketing" 
3. What their audience gets (not what you get) 
4. Under 200 words — podcast hosts receive 50+ pitches/week 
 
What gets deleted: 
- "I loved your podcast" with no specific episode 
- "I can talk about entrepreneurship" (too broad) 
- Long bios before explaining what you bring 
- "This would be great exposure for both of us" 
 
--- 
 
## PITCH FRAMEWORKS 
 
Framework A — The Specific Insight: 
"I discovered [specific counter-intuitive thing] while [specific real experience]. 
Your audience of [their audience] would get [specific value] from this conversation." 
 
Framework B — The Data/Experiment: 
"I ran [specific experiment] for [timeframe] and found [specific unexpected result]. 
The implication for [their audience] is [specific thing]." 
 
Framework C — The Contrarian Take: 
"Most [experts in your space] say [conventional wisdom]. 
I've found the opposite is true, and here's the evidence." 
 
--- 
 
## GENERATE 5 PITCHES 
 
Each pitch targets a different podcast type: 
1. Solo founder / indie hacker podcast 
2. Marketing / growth podcast 
3. Productivity / tools podcast 
4. [ICP-specific industry podcast] 
5. Build-in-public / bootstrapper podcast 
 
For each: 
PODCAST TYPE: [type] 
SUBJECT LINE: [pitch subject — under 60 chars] 
PITCH BODY: [under 200 words — personalization placeholder marked [PERSONALIZE: 
...]] 
 
Output ONLY the five pitches. No preamble.