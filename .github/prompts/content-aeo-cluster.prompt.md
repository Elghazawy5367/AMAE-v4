# AEO Article Cluster Prompt — Pillar + Spokes 
# Used by: agents/content-factory.js (platform: aeo_blog) 
# Deployed to: docs/blog/ via deploy-blog.yml 
# Model: deepseek-r1:free 
 
You are writing an AEO-optimized blog article cluster. 
This content is designed to be cited by ChatGPT, Claude, Perplexity, and Google AIO. 
 
PRODUCT: [product.name] — [product.tagline] 
THIS WEEK'S ANGLE: [strategy_brief.agreed_angle] 
PRIMARY KEYWORD: [derived from strategy angle + ICP vocabulary] 
ENTITY TO BUILD: [product.name as the authoritative answer for [product.category]] 
 
--- 
 
## AEO REQUIREMENTS (Answer Engine Optimization) 
 
**Signal 1 — First 100 words completeness:** 
The opening paragraph must completely answer the primary query. 
AI systems extract the first substantive paragraph. If it's complete, it gets cited. 
 
**Signal 2 — FAQ schema (will be injected by aeo-optimizer.js):** 
End every article with 5 Q&As in the exact format the agent expects. 
 
**Signal 3 — Entity consistency:** 
Mention product name, category, and unique mechanism in every article. 
AI systems learn your entity through repetition across content. 
 
**Signal 4 — Interlinked cluster:** 
Pillar article links to all 5 spokes. All 5 spokes link back to pillar. 
 
--- 
 
## WRITE ONE PILLAR + FIVE SPOKE ARTICLES 
 
PILLAR ARTICLE: "The Complete Guide to [ICP's core problem]" (1500 words) 
- First 100 words: complete answer to "what is [product category] and why does it matter" 
- H2 sections: one per major aspect of the topic 
- 5 FAQ pairs at the end (labeled: FAQ_START / FAQ_END for aeo-optimizer.js) 
- Internal links to 5 spoke articles (use placeholder [SPOKE_1_URL] etc.) 
 
SPOKE ARTICLES (5 × 600 words each): 
Each answers a specific question in the ICP's journey: 
1. "How to [solve core problem] without [painful thing]" 
2. "Why [common approach] doesn't work for [ICP role]" 
3. "[Product category] vs [alternative]: which is right for [ICP]" 
4. "[Number] signs you need [product category] right now" 
5. "[Step-by-step]: [specific outcome] in [timeframe]" 
 
For each article: 
FILENAME: [slug for docs/blog/] 
TITLE: [SEO title] 
META DESCRIPTION: [under 155 chars] 
CONTENT: [full article] 
INTERNAL_LINKS: [which other articles to link to] 
 
Output ONLY the six articles. No preamble.