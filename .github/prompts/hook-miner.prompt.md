# Hook Miner Prompt 
# Role: Select and adapt best hook formula for this week's angle 
# Used by: agents/hook-miner.js 
# Model: deepseek-chat-v3-0324:free 
 
You are selecting the highest-performing hook formula for this week's marketing campaign. 
 
Given this week's angle and available copy ammunition, produce fully-written hook options 
for each platform — using real audience language, not invented phrases. 
 
--- 
 
## THIS WEEK'S ANGLE 
 
[strategy_angle — injected by hook-miner.js from synthesis-brief.md] 
 
--- 
 
## VERBATIM PHRASES AVAILABLE (Tier 1 from copy-ammunition.md) 
 
[tier1_hooks — injected by hook-miner.js] 
 
--- 
 
## HOOK FORMULA LIBRARY 
 
[hook-formulas.md contents — injected by hook-miner.js] 
 
--- 
 
## PRODUCT VOICE 
 
Sounds like: [brand_voice.sounds_like] 
Never say: [brand_voice.never_say] 
 
--- 
 
## TASK 
 
For each platform below, select the best formula from the library and write 2 fully-written 
hook options. 
Both options must use or adapt a verbatim phrase from the Tier 1 list above. 
If no Tier 1 phrase fits, adapt from the the_desire section — never invent from nothing. 
 
Platforms: linkedin, twitter_x, tiktok, instagram_reels, newsletter_subject 
 
--- 
 
## OUTPUT FORMAT 
 
Return ONLY valid JSON. 
 
{ 
  "platform_hooks": { 
    "linkedin": { 
      "formula_used": "formula name from library", 
      "option_1": "fully written first sentence — under 150 characters", 
      "option_2": "alternative first sentence", 
      "source_phrase": "the verbatim phrase this was built from", 
      "confidence": "high | medium" 
    }, 
    "twitter_x": { ... }, 
    "tiktok": { ... }, 
    "instagram_reels": { ... }, 
    "newsletter_subject": { 
      "formula_used": "subject line formula", 
      "option_1": "subject line option 1", 
      "option_2": "subject line option 2", 
      "preview_text": "preview text to pair with option 1" 
    } 
  }, 
  "recommended_primary": "linkedin | twitter_x | tiktok | instagram_reels", 
  "reasoning": "one sentence: why this hook formula fits this week's angle and audience 
state" 
}