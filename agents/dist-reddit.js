// === FILE: agents/dist-reddit.js === 
// 🔴 CRITICAL: THIS AGENT NEVER AUTO-POSTS TO REDDIT 
// Job: Write the reddit post draft to a clearly-labeled file for manual posting 
// Reads: campaigns/[WEEK]/text/reddit-post.md 
// Writes: campaigns/[WEEK]/REDDIT_MANUAL_POST.md (clearly labeled for founder) 
 
import { readText, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getCurrentWeek }                  from '../lib/week-utils.js'; 
 
async function main() { 
  const week        = getCurrentWeek(); 
  const contentFile = process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/reddit-post.md`; 
  const content     = readText(contentFile); 
 
  if (!content) { 
    console.log('[dist-reddit.js] No reddit post file found. Skipping.'); 
    return; 
  } 
 
  // Extract suggested subreddit 
  const subredditMatch = content.match(/COMMUNITY:\s*(r\/\S+)/i); 
  const subreddit = subredditMatch?.[1] ?? 'r/[check intelligence/weekly/audience-map.json]'; 
 
  const manualFile = `campaigns/${week}/REDDIT_MANUAL_POST.md`; 
  const instructions = `# 🔴 REDDIT — POST MANUALLY 
 
**NEVER use an API to post Reddit content. Manual posting only.** 
 
Suggested subreddit: ${subreddit} 
 
**Before posting:** 
1. Check your posting history in ${subreddit} — have you contributed value there before? 
2. Read the subreddit rules (especially about self-promotion) 
3. Verify this post genuinely helps the community first 
 
--- 
 
${content} 
 
--- 
 
**After posting:** Log it in analytics/resonance-log.md 
`; 
 
  writeFile(manualFile, instructions); 
  console.log(`[dist-reddit.js] Manual posting instructions written to: ${manualFile}`); 
  console.log('[dist-reddit.js] 🔴 Post this manually — NEVER via API. Reddit bans bots 
permanently.'); 
} 
 
main();