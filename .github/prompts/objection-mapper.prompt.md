# Objection Mapper Prompt 
# Role: Map objections and generate pre-emption content 
# Used by: agents/objection-mapper.js 
# Model: deepseek-r1:free 
 
You are mapping the objections a skeptical prospect would have this week 
and generating pre-emption content that addresses them before they're raised. 
 
--- 
 
## PRODUCT CONTEXT 
 
Product: [product.name] 
Stage: [product.stage] 
Unique angle: [solution.unique_angle] 
What we are NOT: [solution.what_you_are_not] 
 
--- 
 
## COMPETITOR FAILURE DATA THIS WEEK 
 
[competitor-failures.md contents] 
 
--- 
 
## AUDIENCE SOPHISTICATION 
 
Level: [icp.sophistication_level] 
They've tried: list from pain_points context 
 
--- 
 
## OBJECTION CATEGORIES TO MAP 
 
1. Category objections: "I already use [competitor]", "I tried something like this before" 
2. Trust objections: "How do I know this works?", "Is this actively maintained?" 
3. Complexity objections: "This seems hard to set up", "I'm not technical" 
4. Value objections: "I can do this manually", "Not worth the cost" 
5. Timing objections: "Not the right time", "We're too busy right now" 
 
--- 
 
## OUTPUT FORMAT 
 
Return ONLY valid JSON. 
 
{ 
  "objection_map": [ 
    { 
      "objection": "exact objection as they would say it", 
      "category": "category | trust | complexity | value | timing", 
      "frequency": "high | medium | low — based on competitor failure data", 
      "pre_emption_angle": "how to address this BEFORE they raise it", 
      "content_ready_sentence": "one sentence ready to use in content", 
      "best_content_type": "BOFU comparison | MOFU case study | TOFU story", 
      "platform_fit": ["linkedin", "email", "quora"] 
    } 
  ], 
  "primary_objection_this_week": "the one objection to address in every piece this week", 
  "objection_library_additions": ["new objections worth adding to 
intelligence/evergreen/objection-library.md"] 
}