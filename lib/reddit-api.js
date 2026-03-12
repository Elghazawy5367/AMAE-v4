// === FILE: lib/reddit-api.js === 
// Job: Reddit JSON API wrapper — no auth, no API key, completely free 
// Reads: nothing 
// Writes: nothing 
// Called by: copy-excavator.js, audience-locator.js 
 
import { scoreBuyingIntent, scoreUrgency, extractBestQuotes } from './scoring-algorithms.js'; 
 
const BASE_URL   = 'https://www.reddit.com'; 
const USER_AGENT = 'AMAE/1.0 (autonomous-marketing-engine; contact: 
your@email.com)'; 
 
// Rate limiting — Reddit allows ~30 req/min without auth 
const REQUEST_DELAY_MS = 1200; 
 
let lastRequestTime = 0; 
 
async function rateLimitedFetch(url) { 
  const now     = Date.now(); 
  const elapsed = now - lastRequestTime; 
  if (elapsed < REQUEST_DELAY_MS) { 
    await sleep(REQUEST_DELAY_MS - elapsed); 
  } 
  lastRequestTime = Date.now(); 
 
  const response = await fetch(url, { 
    headers: { 
      'User-Agent': USER_AGENT, 
      'Accept':     'application/json', 
    }, 
  }); 
  return response; 
} 
 
/** 
 * Fetch posts from a subreddit. 
 * @param {string} sub    - subreddit name without r/ (e.g. 'sideproject') 
 * @param {string} sort   - 'hot' | 'new' | 'rising' | 'top' 
 * @param {number} limit  - number of posts (max 100) 
 * @returns {Array} scored post objects 
 */ 
export async function fetchSubreddit(sub, sort = 'hot', limit = 25) { 
  const url = `${BASE_URL}/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`; 
  console.log(`[reddit-api] Fetching r/${sub} (${sort}, limit=${limit})`); 
 
  try { 
    const response = await rateLimitedFetch(url); 
 
    if (response.status === 404) { 
      console.log(`[reddit-api] r/${sub} not found — skipping`); 
      return []; 
    } 
    if (response.status === 403) { 
      console.log(`[reddit-api] r/${sub} is private or restricted — skipping`); 
      return []; 
    } 
    if (!response.ok) { 
      console.error(`[reddit-api] r/${sub} returned ${response.status} — skipping`); 
      return []; 
    } 
 
    const data = await response.json(); 
 
    if (!data?.data?.children) { 
      console.error(`[reddit-api] Unexpected response shape from r/${sub}`); 
      return []; 
    } 
 
    return data.data.children 
      .filter(child => child.kind === 't3') // Posts only, not comments 
      .map(child => scorePost(child.data)); 
 
  } catch (err) { 
    console.error(`[reddit-api] Network error on r/${sub}:`, err.message); 
    return []; 
  } 
} 
 
/** 
 * Fetch multiple subreddits across multiple sort orders. 
 * Deduplicates by post ID. 
 * @param {string[]} subs 
 * @param {string[]} sorts 
 * @param {number}   limit 
 */ 
export async function fetchSubreddits(subs, sorts = ['hot', 'rising'], limit = 25) { 
  const allResults = []; 
  const seenIds    = new Set(); 
 
  for (const sub of subs) { 
    for (const sort of sorts) { 
      const posts = await fetchSubreddit(sub, sort, limit); 
      for (const post of posts) { 
        if (!seenIds.has(post.id)) { 
          seenIds.add(post.id); 
          allResults.push(post); 
        } 
      } 
    } 
  } 
 
  return allResults.sort((a, b) => b.buying_intent - a.buying_intent); 
} 
 
/** 
 * Search Reddit for a keyword across all of Reddit. 
 * @param {string} query 
 * @param {number} limit 
 */ 
export async function searchReddit(query, limit = 25) { 
  const encoded = encodeURIComponent(query); 
  const url     = 
`${BASE_URL}/search.json?q=${encoded}&sort=relevance&t=week&limit=${limit}&raw_json
=1`; 
  console.log(`[reddit-api] Searching: "${query}"`); 
 
  try { 
    const response = await rateLimitedFetch(url); 
    if (!response.ok) return []; 
    const data = await response.json(); 
    return (data?.data?.children || []).map(c => scorePost(c.data)); 
  } catch (err) { 
    console.error('[reddit-api] Search error:', err.message); 
    return []; 
  } 
} 
 
/** 
 * Enrich a raw Reddit post with AMAE scoring. 
 * @param {object} p - raw Reddit post data 
 */ 
function scorePost(p) { 
  const ageHours = (Date.now() / 1000 - p.created_utc) / 3600; 
  const fullText = `${p.title} ${p.selftext || ''}`; 
 
  return { 
    id:            p.id, 
    title:         p.title, 
    body:          p.selftext || '', 
    score:         p.score, 
    upvote_ratio:  p.upvote_ratio, 
    num_comments:  p.num_comments, 
    created_utc:   p.created_utc, 
    age_hours:     Math.round(ageHours), 
    permalink:     `https://www.reddit.com${p.permalink}`, 
    subreddit:     p.subreddit, 
    // AMAE scores 
    buying_intent: scoreBuyingIntent(fullText), 
    urgency:       scoreUrgency(fullText, ageHours), 
    best_quotes:   extractBestQuotes(fullText, 3), 
  }; 
} 
 
function sleep(ms) { 
  return new Promise(resolve => setTimeout(resolve, ms)); 
}