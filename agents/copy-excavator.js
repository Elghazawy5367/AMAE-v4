// === FILE: agents/copy-excavator.js === 
// Job: Mine Reddit every Tuesday for verbatim audience pain language 
// Reads: config/product-dna.json, config/intelligence-config.json 
// Writes: intelligence/weekly/copy-ammunition.md 
// Called by: .github/workflows/weekly-intelligence.yml 
 
import { fetchSubreddits, searchReddit } from '../lib/reddit-api.js'; 
import { readJSON, writeText }           from '../lib/file-utils.js'; 
import { getIntelFolder, getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[copy-excavator] Starting Reddit intelligence mining...'); 
 
  const dna    = readJSON('config/product-dna.json'); 
  const config = readJSON('config/intelligence-config.json'); 
 
  if (!dna || !config) { 
    console.error('[copy-excavator] Cannot read config files — aborting'); 
    process.exit(1); 
  } 
 
  const product         = dna.products[dna.active_product]; 
  const subreddits      = config.reddit.subreddits; 
  const minIntentScore  = config.reddit.min_buying_intent_score ?? 2.0; 
  const minUrgency      = config.reddit.min_urgency_score ?? 15; 
  const minPostScore    = config.reddit.min_post_score ?? 10; 
 
  console.log(`[copy-excavator] Mining ${subreddits.length} subreddits for 
"${product.name}"`); 
 
  // Fetch from configured subreddits (hot + rising for freshness) 
  const allPosts = await fetchSubreddits(subreddits, config.reddit.sorts ?? ['hot', 'rising'], 
config.reddit.limit_per_sub ?? 25); 
 
  console.log(`[copy-excavator] Total posts fetched: ${allPosts.length}`); 
 
  // Also search for buying signal keywords 
  const buyingSignals = config.buying_signal_keywords ?? []; 
  const searchResults = []; 
  for (const keyword of buyingSignals.slice(0, 3)) { // Limit to 3 searches 
    const results = await searchReddit(keyword, 15); 
    searchResults.push(...results); 
  } 
 
  // Combine and filter 
  const combined = [...allPosts, ...searchResults]; 
  const highValue = combined.filter(p => 
    p.buying_intent >= minIntentScore && 
    p.urgency >= minUrgency && 
    p.score >= minPostScore 
  ); 
 
  console.log(`[copy-excavator] High-value posts: ${highValue.length}/${combined.length}`); 
 
  // Separate quotes into tiers 
  const tier1 = []; // Score 8–10: use verbatim 
  const tier2 = []; // Score 5–7: adapt lightly 
  const seenSentences = new Set(); 
 
  for (const post of highValue) { 
    for (const q of post.best_quotes) { 
      // Deduplicate 
      const key = q.sentence.slice(0, 50).toLowerCase(); 
      if (seenSentences.has(key)) continue; 
      seenSentences.add(key); 
 
      const entry = { 
        sentence:    q.sentence, 
        score:       q.score, 
        source:      post.permalink, 
        subreddit:   post.subreddit, 
        post_title:  post.title, 
        post_score:  post.score, 
        buying_intent: post.buying_intent, 
      }; 
 
      if (q.score >= 8)      tier1.push(entry); 
      else if (q.score >= 5) tier2.push(entry); 
    } 
  } 
 
  // Find competitor mentions 
  const competitorMentions = []; 
  const competitors = product.competitors ?? []; 
  for (const post of highValue) { 
    for (const comp of competitors) { 
      const lower = `${post.title} ${post.body}`.toLowerCase(); 
      if (lower.includes(comp.name.toLowerCase())) { 
        competitorMentions.push({ 
          competitor:  comp.name, 
          post_title:  post.title, 
          permalink:   post.permalink, 
          sentiment:   inferSentiment(lower, comp.name.toLowerCase()), 
        }); 
      } 
    } 
  } 
 
  // Build markdown output 
  const week = getCurrentWeek(); 
  const lines = [ 
    `# Copy Ammunition — ${week}`, 
    `_Mined: ${getTodayString()} from ${subreddits.length} subreddits + 
${buyingSignals.length} keyword searches_`, 
    `_High-value posts: ${highValue.length} of ${combined.length} total_`, 
    '', 
    '---', 
    '', 
    '## TIER 1 HOOKS — Use Verbatim (score 8–10)', 
    '_These are real sentences from real people. Use as your opening line. Adapt minimally._', 
    '', 
  ]; 
 
  if (tier1.length === 0) { 
    lines.push('_No Tier 1 quotes found this week._'); 
    lines.push('_Action: expand `subreddits` in intelligence-config.json or lower 
`min_buying_intent_score`_'); 
    lines.push(''); 
  } else { 
    for (const q of tier1.slice(0, 12)) { 
      lines.push(`> "${q.sentence}"`); 
      lines.push(`- **Score:** ${q.score}/10 &nbsp;|&nbsp; **r/${q.subreddit}** &nbsp;|&nbsp; 
Post score: ${q.post_score}`); 
      lines.push(`- **Intent:** ${q.buying_intent}/10 &nbsp;|&nbsp; [Source](${q.source})`); 
      lines.push(''); 
    } 
  } 
 
  lines.push('---', ''); 
  lines.push('## TIER 2 PHRASES — Adapt Lightly (score 5–7)'); 
  lines.push('_Preserve the core language and emotional register. Rewrite the structure._'); 
  lines.push(''); 
 
  for (const q of tier2.slice(0, 20)) { 
    lines.push(`> "${q.sentence}"`); 
    lines.push(`- Score: ${q.score}/10 | r/${q.subreddit} | [Source](${q.source})`); 
    lines.push(''); 
  } 
 
  lines.push('---', ''); 
  lines.push('## COMPETITOR MENTIONS'); 
 
  if (competitorMentions.length === 0) { 
    lines.push('_No competitor mentions found this week._'); 
  } else { 
    for (const m of competitorMentions.slice(0, 8)) { 
      lines.push(`- **${m.competitor}** — sentiment: ${m.sentiment}`); 
      lines.push(`  [${m.post_title.slice(0, 60)}](${m.permalink})`); 
      lines.push(''); 
    } 
  } 
 
  lines.push('---', ''); 
  lines.push('## WEEK STATS'); 
  lines.push(`| Metric | Value |`); 
  lines.push(`| --- | --- |`); 
  lines.push(`| Subreddits mined | ${subreddits.length} |`); 
  lines.push(`| Total posts | ${combined.length} |`); 
  lines.push(`| High-intent posts | ${highValue.length} |`); 
  lines.push(`| Tier 1 hooks | ${tier1.length} |`); 
  lines.push(`| Tier 2 phrases | ${tier2.length} |`); 
  lines.push(`| Competitor mentions | ${competitorMentions.length} |`); 
 
  const outputPath = `${getIntelFolder()}/copy-ammunition.md`; 
  writeText(outputPath, lines.join('\n')); 
 
  console.log(`[copy-excavator] Done. ${tier1.length} Tier 1 hooks, ${tier2.length} Tier 2 
phrases written.`); 
} 
 
function inferSentiment(text, compName) { 
  const negativeContext = ['problem', 'issue', 'hate', 'broken', 'terrible', 'frustrated', 'worst', 
'bad', 'slow', 'expensive']; 
  const positiveContext = ['love', 'great', 'amazing', 'best', 'recommend', 'switched to', 'happy 
with']; 
 
  const idx = text.indexOf(compName); 
  const window = text.slice(Math.max(0, idx - 100), idx + 150); 
 
  const negCount = negativeContext.filter(w => window.includes(w)).length; 
  const posCount = positiveContext.filter(w => window.includes(w)).length; 
 
  if (negCount > posCount) return 'negative (copy opportunity)'; 
  if (posCount > negCount) return 'positive (market validation)'; 
  return 'neutral'; 
} 
 
main();