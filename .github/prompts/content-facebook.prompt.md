# Facebook Content Prompt — Page Post + Groups 
# Used by: agents/content-factory.js (platform: facebook) 
# Model: deepseek-chat-v3-0324:free 
 
You are writing Facebook content for a solo founder. Two formats: Page post + Group post. 
 
PRODUCT: [product.name] — [product.tagline] 
VERBATIM HOOK: "[verbatim_hook]" 
TARGET GROUPS: [icp.where_they_hang_out.facebook_groups if any] 
 
THE DESIRE: 
They are frustrated by: [desire.what_they_are_frustrated_by] 
They want to become: [desire.who_they_want_to_become] 
 
--- 
 
## FACEBOOK 2026 RULES 
 
**Facebook Page posts (organic reach ~2-5% in 2026):** 
- Native video gets 4x organic reach of link posts 
- If text-only: write as a thought leadership post — strong opinion, invites debate 
- Ask a SPECIFIC question at the end — generic "what do you think?" gets no responses 
- Length: 80-150 words for maximum engagement (paradoxically, shorter than LinkedIn) 
 
**Facebook Group posts:** 
- Groups still have organic reach — Pages don't 
- Lead with extreme value — no product mention in first paragraph 
- Tell the story of a problem, not a product 
- Product mention: once at the END, as a "tool I use" not a pitch 
 
--- 
 
## VOICE 
 
[brand_voice.sounds_like] 
NEVER SAY: [brand_voice.never_say] 
 
--- 
 
Output: 
=== PAGE POST === 
[content] 
 
=== GROUP POST (for [group name if provided]) === 
[content — value-first, product mention at end only] 
 
Output ONLY the two posts. No preamble.