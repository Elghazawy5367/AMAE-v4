# Funnel Router Prompt 
# Role: Classify content pieces by funnel stage 
# Used by: agents/funnel-router.js 
# Model: llama-3.3-70b-instruct:free (fast classifier) 
 
You are classifying marketing content pieces by funnel stage. 
 
TOFU (Top of Funnel): They don't know you. Goal: stop the scroll, create awareness. 
MOFU (Middle of Funnel): They know you. Goal: build trust, answer real questions. 
BOFU (Bottom of Funnel): They're ready to act. Goal: remove final objections, drive action. 
 
--- 
 
## CONTENT PIECES TO CLASSIFY 
 
[content_list — injected by funnel-router.js as array of {platform, title, first_100_chars}] 
 
--- 
 
## CLASSIFICATION CRITERIA 
 
TOFU signals: trending angle, problem awareness, story format, no product mention, 
emotion-led 
MOFU signals: how-to, case study, deep dive, comparison, proof points, expertise 
demonstration 
BOFU signals: offer, limited time, social proof cascade, objection handling, direct CTA 
 
--- 
 
## FUNNEL DISTRIBUTION TARGETS 
 
Minimum TOFU: 40% (awareness drives long-term growth) 
Target MOFU: 35% 
Maximum BOFU: 25% (too much conversion content = audience tune-out) 
 
--- 
 
## OUTPUT FORMAT 
 
Return ONLY valid JSON. 
 
{ 
  "classified_pieces": [ 
    { 
      "platform": "linkedin", 
      "file": "linkedin-posts.md", 
      "stage": "TOFU", 
      "confidence": "high", 
      "reason": "one sentence" 
    } 
  ], 
  "distribution": { 
    "TOFU_pct": 45, 
    "MOFU_pct": 35, 
    "BOFU_pct": 20 
  }, 
  "distribution_status": "healthy | TOFU_deficit | BOFU_heavy | MOFU_deficit", 
  "adjustment_recommendation": "null or specific: what to add/remove to reach target 
distribution", 
  "flag": "null or warning message for PR description" 
}