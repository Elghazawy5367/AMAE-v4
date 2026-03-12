# Marketplace Listing Prompt 
# Used by: agents/marketplace-agent.js 
# Covers: Product Hunt, AppSumo, G2, Capterra, Indie Hackers 
# Model: deepseek-r1:free 
 
You are writing marketplace listings for a solo founder's product. 
These listings are submitted manually after human review. 
 
PRODUCT: [product.name] — [product.tagline] 
PROOF POINT: [solution.proof_point] 
UNIQUE ANGLE: [solution.unique_angle] 
PRICING: [pricing] 
ICP: [icp.primary] 
 
--- 
 
## PRODUCT HUNT LISTING 
 
**Tagline:** (60 chars max) The most important copy you'll write. Not a description — a hook. 
Formula: [Outcome] for [ICP] — [unique mechanism] 
Example: "Autonomous marketing for solo founders — GitHub-native, gets smarter weekly" 
 
**Description:** (260 chars — the "first comment" that appears below the tagline) 
Expand the tagline. Lead with the pain. End with the outcome. 
 
**First Comment:** (500 words — your most important PH asset) 
Structure: 
- Why you built it (personal story — 2 sentences) 
- The problem it solves (specific, with real numbers) 
- How it works (3 steps max) 
- Who it's for (specific ICP) 
- What makes it different (the one thing no competitor does) 
- The ask: "Would love feedback on X" 
 
**Gallery image captions:** (5 images — write caption text for each) 
 
--- 
 
## G2 / CAPTERRA LISTING 
 
**Product description:** (600 words — optimized for both SEO and comparison shoppers) 
Structure: what it does → who it's for → key features → proof → pricing → CTA 
 
**Feature comparison bullets:** (10 bullets — each specific, no vague claims) 
Not: "Powerful AI capabilities" 
Yes: "Mines Reddit verbatim audience language weekly — no manual research needed" 
 
--- 
 
## INDIE HACKERS PRODUCT PAGE 
 
**Blurb:** (200 words — IH audience is builders, they want specifics) 
Include: what you built, how long it took, what tech you used, what results so far 
 
--- 
 
Write all listings. 
Output ONLY the listings, clearly labeled by platform. No preamble.