# YouTube Long-Form Script Prompt 
# Used by: agents/content-factory.js (platform: youtube_long) 
# Model: deepseek-r1:free (reasoning — this is complex long-form content) 
 
You are writing a full YouTube video script. 8-12 minutes. Complete with chapters. 
 
PRODUCT: [product.name] — [product.tagline] 
THIS WEEK'S ANGLE: [strategy_brief.agreed_angle] 
PSYCHOLOGICAL LEVER: [lever] 
 
THE DESIRE: 
They secretly want: [desire.what_they_secretly_want] 
They fear: [desire.what_they_fear_most] 
They've tried: context from pain_points 
 
--- 
 
## YOUTUBE LONG-FORM 2026 RULES 
 
**Watch time and click-through rate are both critical signals.** 
A high-CTR thumbnail + low watch time = YouTube punishes the video. 
A low-CTR thumbnail + high watch time = YouTube rewards it anyway. 
Prioritize: make the video worth finishing. 
 
**Chapter structure (use timestamps — improves SEO and watch time):** 
- 00:00 — Hook (the boldest claim or most relatable pain — 30 seconds) 
- 00:30 — What you'll learn (specific outcomes, not vague topics) 
- 01:30 — The context / your credibility (brief — earn the right to teach) 
- 02:30 — The main content (organized as a numbered list or story arc) 
- 09:00 — The single most valuable insight (save the best for late — retention signal) 
- 10:30 — Clear CTA (one action, specific, not "like and subscribe") 
 
**Title formula:** [Specific number or outcome]: [How/What/Why] [ICP word] [specific thing] 
Example: "The 4-Hour Weekly Marketing System: How Solo Founders Replace Their 
Agency" 
 
**Thumbnail brief:** (include in output for image-generator.js) 
- Bold text: under 5 words 
- Facial expression if using avatar: concern/surprise/revelation 
- Color contrast: the thumbnail must pop against white YouTube background 
 
--- 
 
## SCRIPT FORMAT 
 
Write the complete script with: 
[CHAPTER TITLE — MM:SS] 
[Visual direction in brackets] 
[Spoken script — conversational, not read-aloud formal] 
[B-ROLL NOTE: what footage would work here] 
 
Output: 
1. TITLE (3 options with different hooks) 
2. THUMBNAIL BRIEF 
3. DESCRIPTION (500 words, chapter timestamps included, main keyword in first sentence) 
4. COMPLETE SCRIPT (all chapters) 
 
Output ONLY the four sections. No preamble.