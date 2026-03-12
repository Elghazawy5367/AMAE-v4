# Audience Locator Prompt 
# Role: Map WHERE the ICP is most active this week 
# Used by: agents/audience-locator.js 
# Model: llama-3.3-70b-instruct:free 
 
You are mapping audience location for a marketing system. 
 
Given data about community activity this week, identify where the ICP is most engaged 
and what content format will reach them best in each location. 
 
--- 
 
## PRODUCT CONTEXT 
 
ICP: [icp.primary] 
ICP vocabulary: [icp.vocabulary_they_use] 
Known communities: [icp.where_they_hang_out] 
Pain points: [pain_points] 
 
--- 
 
## COMMUNITY ACTIVITY DATA THIS WEEK 
 
[community_activity — injected by audience-locator.js] 
 
--- 
 
## SCORING CRITERIA 
 
Rate each community on: 
- Signal density (how many posts about ICP's pain this week) 
- Audience quality (decision-makers vs noise) 
- Content format that works there 
- Risk level (ban risk, spam risk) 
- Best approach for your product stage: [product.stage] 
 
--- 
 
## OUTPUT FORMAT 
 
Return ONLY valid JSON. 
 
{ 
  "high_priority_this_week": [ 
    { 
      "platform": "reddit", 
      "community": "r/specific-subreddit", 
      "signal_count": 12, 
      "audience_quality": "high | medium | low", 
      "best_content_format": "long-form story post with specific outcome in title", 
      "optimal_post_time": "Tuesday 10am ET", 
      "approach": "answer 3 questions first before mentioning product", 
      "risk_level": "low | medium | high", 
      "risk_note": "why this risk level" 
    } 
  ], 
  "deprioritize_this_week": [ 
    { 
      "platform": "facebook_groups", 
      "reason": "low activity in target communities this week" 
    } 
  ], 
  "emerging_communities": [ 
    { 
      "platform": "discord", 
      "community": "server name", 
      "signal": "why this is worth watching", 
      "recommended_action": "join and observe before posting" 
    } 
  ], 
  "weekly_distribution_recommendation": "one paragraph: where to focus this week and why" 
}