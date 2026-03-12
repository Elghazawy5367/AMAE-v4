// === FILE: agents/timing-scout.js === 
// Job: Detect trending topics on HN + Reddit rising with velocity scoring 
// Reads: config/product-dna.json, config/intelligence-config.json 
// Writes: intelligence/weekly/timing-windows.json 
// Called by: .github/workflows/weekly-intelligence.yml 
 
import { fetchHNTrending, filterByRelevance, fetchHNAskPosts } from 
'../lib/hackernews-api.js'; 
import { fetchSubreddit }         from '../lib/reddit-api.js'; 
import { scoreTrendVelocity, classifyTrend } from '../lib/scoring-algorithms.js'; 
import { readJSON, writeJSON }    from '../lib/file-utils.js'; 
import { getIntelFolder, getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[timing-scout] Starting trend velocity detection...'); 
 
  const dna    = readJSON('config/product-dna.json'); 
  const config = readJSON('config/intelligence-config.json'); 
 
  if (!dna || !config) { 
    console.error('[timing-scout] Cannot read config files — aborting'); 
    process.exit(1); 
  } 
 
  const keywords   = config.hackernews.relevance_keywords ?? []; 
  const subreddits = config.reddit.subreddits ?? []; 
 
  // ── HN Trending 
─────────────────────────────────────────────────────────
──── 
  console.log('[timing-scout] Fetching HN trending...'); 
  const allHN     = await fetchHNTrending(config.hackernews.min_points ?? 50, 
config.hackernews.hits_per_page ?? 30); 
  const relevantHN = filterByRelevance(allHN, keywords); 
  console.log(`[timing-scout] HN: ${relevantHN.length} relevant of ${allHN.length} trending`); 
 
  // ── HN Ask Posts 
─────────────────────────────────────────────────────────
──── 
  console.log('[timing-scout] Fetching Ask HN...'); 
  const askPosts = await fetchHNAskPosts(15); 
  const relevantAsk = filterByRelevance(askPosts, keywords); 
 
  // ── Reddit Rising 
─────────────────────────────────────────────────────────
──── 
  console.log('[timing-scout] Fetching Reddit rising...'); 
  const risingPosts = []; 
  for (const sub of subreddits.slice(0, 4)) { 
    const posts = await fetchSubreddit(sub, 'rising', 20); 
    // Only posts with enough momentum and some engagement 
    const filtered = posts.filter(p => p.score >= 15 && p.num_comments >= 3); 
    risingPosts.push(...filtered); 
  } 
  console.log(`[timing-scout] Reddit rising: ${risingPosts.length} posts across 
${Math.min(subreddits.length, 4)} subreddits`); 
 
  // ── Classify into buckets 
───────────────────────────────────────────────────── 
  const buckets = { 
    publish_now:       [], 
    prepare_next_week: [], 
    monitor:           [], 
    peaked_avoid:      [], 
  }; 
 
  for (const item of relevantHN) { 
    buckets[item.trend_class]?.push({ 
      topic:           item.title, 
      velocity:        item.velocity, 
      points:          item.points, 
      comments:        item.comments, 
      age_hours:       item.age_hours, 
      source:          'hackernews', 
      url:             item.hn_url, 
      trend_class:     item.trend_class, 
      content_angle:   deriveAngle(item.title, keywords), 
    }); 
  } 
 
  for (const post of risingPosts) { 
    const velocity   = scoreTrendVelocity(post.score, post.age_hours); 
    const trendClass = classifyTrend(velocity); 
    if (trendClass === 'publish_now' || trendClass === 'prepare_next_week') { 
      buckets[trendClass].push({ 
        topic:       post.title, 
        velocity:    velocity, 
        points:      post.score, 
        comments:    post.num_comments, 
        age_hours:   post.age_hours, 
        source:      `r/${post.subreddit}`, 
        url:         post.permalink, 
        trend_class: trendClass, 
        content_angle: deriveAngle(post.title, keywords), 
      }); 
    } 
  } 
 
  // Sort each bucket by velocity 
  for (const bucket of Object.values(buckets)) { 
    bucket.sort((a, b) => b.velocity - a.velocity); 
  } 
 
  // ── Build output 
─────────────────────────────────────────────────────────
───── 
  const output = { 
    generated:         getTodayString(), 
    week:              getCurrentWeek(), 
    publish_now:       buckets.publish_now.slice(0, 5), 
    prepare_next_week: buckets.prepare_next_week.slice(0, 5), 
    monitor:           buckets.monitor.slice(0, 3), 
    peaked_avoid:      buckets.peaked_avoid.slice(0, 3), 
    ask_hn_questions:  relevantAsk.slice(0, 5).map(a => ({ title: a.title, url: a.hn_url })), 
    summary: { 
      publish_now_count:       buckets.publish_now.length, 
      prepare_next_week_count: buckets.prepare_next_week.length, 
      top_velocity_topic:      buckets.publish_now[0]?.topic ?? 'None found', 
    }, 
  }; 
 
  writeJSON(`${getIntelFolder()}/timing-windows.json`, output); 
  console.log(`[timing-scout] Done. ${buckets.publish_now.length} publish-now topics, 
${buckets.prepare_next_week.length} next-week topics.`); 
} 
 
function deriveAngle(title, keywords) { 
  const lower = title.toLowerCase(); 
  for (const kw of keywords) { 
    if (lower.includes(kw.toLowerCase())) { 
      return `${kw} angle — "${title.slice(0, 60)}"`; 
    } 
  } 
  return title.slice(0, 80); 
} 
 
main();