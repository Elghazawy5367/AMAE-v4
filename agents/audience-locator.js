// === FILE: agents/audience-locator.js === 
// Job: Map where the ICP is most active this week 
// Reads: config/product-dna.json, intelligence/weekly/copy-ammunition.md 
// Writes: intelligence/weekly/audience-map.json 
// Called by: .github/workflows/weekly-intelligence.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, writeJSON, readText, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function scanSubreddits(subreddits) { 
  const activity = []; 
 
  for (const subreddit of subreddits.slice(0, 8)) { 
    try { 
      const url  = `https://www.reddit.com${subreddit}/new.json?limit=25`; 
      const resp = await fetch(url, { headers: { 'User-Agent': 'AMAE-Locator/1.0' } }); 
      if (!resp.ok) continue; 
 
      const data  = await resp.json(); 
      const posts = data?.data?.children ?? []; 
 
      activity.push({ 
        community: subreddit, 
        platform:  'reddit', 
        post_count_24h: posts.filter(p => (Date.now() / 1000 - p.data.created_utc) < 
86400).length, 
        total_upvotes:  posts.reduce((s, p) => s + (p.data.score ?? 0), 0), 
        top_post:       posts[0]?.data?.title ?? '', 
      }); 
 
      await new Promise(r => setTimeout(r, 800)); 
    } catch (err) { 
      console.log(`[audience-locator.js] Skipping ${subreddit}: ${err.message}`); 
    } 
  } 
 
  return activity; 
} 
 
async function main() { 
  console.log('[audience-locator.js] Mapping audience location...'); 
 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna.products[dna.active_product]; 
  const subreddits = product?.icp?.where_they_hang_out?.reddit ?? []; 
  const copyAmmo   = readText('intelligence/weekly/copy-ammunition.md') ?? ''; 
 
  const redditActivity = await scanSubreddits(subreddits); 
 
  const prompt = `You are mapping where an ICP is most active this week for marketing 
targeting. 
 
ICP: ${product.icp?.primary ?? ''} 
ICP vocabulary: ${JSON.stringify(product.icp?.vocabulary_they_use ?? [])} 
Pain points: ${JSON.stringify(product.pain_points ?? [])} 
 
COMMUNITY ACTIVITY DATA: 
${JSON.stringify(redditActivity, null, 2)} 
 
COPY AMMUNITION THEMES THIS WEEK: 
${copyAmmo.slice(0, 2000)} 
 
For each community, determine: 
- Audience quality (decision-makers vs noise) 
- Best content format for this community 
- Optimal approach for stage: ${product.stage ?? 'launched'} 
- Risk level 
 
Return ONLY valid JSON: 
{ 
  "high_priority_this_week": [...], 
  "deprioritize_this_week": [...], 
  "emerging_communities": [...], 
  "weekly_distribution_recommendation": "one paragraph" 
}`; 
 
  const raw  = await callModel([{ role: 'user', content: prompt }], MODELS.CLASSIFIER, 
1500, 0.4); 
  const data = parseJSON(raw); 
 
  ensureDir('intelligence/weekly'); 
  writeJSON('intelligence/weekly/audience-map.json', { 
    generated: getTodayString(), 
    week:      getCurrentWeek(), 
    ...data, 
  }); 
 
  console.log('[audience-locator.js] Done. Audience map written.'); 
} 
 
main();