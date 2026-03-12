// === FILE: agents/dist-linkedin.js === 
// Job: Post to LinkedIn Pages API 
// Requires: LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN secrets 
// IMPORTANT: Posts the first post from linkedin-posts.md — carousel requires PDF upload 
(manual) 
 
import { readText, ensureDir, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek } from '../lib/week-utils.js'; 
 
const LI_API = 'https://api.linkedin.com/rest'; 
 
async function postToLinkedIn(text, authorUrn) { 
  const token = process.env.LINKEDIN_ACCESS_TOKEN; 
  if (!token) throw new Error('[dist-linkedin.js] LINKEDIN_ACCESS_TOKEN not set'); 
 
  const response = await fetch(`${LI_API}/posts`, { 
    method:  'POST', 
    headers: { 
      'Authorization':   `Bearer ${token}`, 
      'Content-Type':    'application/json', 
      'X-Restli-Protocol-Version': '2.0.0', 
      'LinkedIn-Version': '202411', 
    }, 
    body: JSON.stringify({ 
      author:         authorUrn, 
      commentary:     text, 
      visibility:     'PUBLIC', 
      distribution: { 
        feedDistribution: 'MAIN_FEED', 
        targetEntities:   [], 
        thirdPartyDistributionChannels: [], 
      }, 
      lifecycleState: 'PUBLISHED', 
    }), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[dist-linkedin.js] API error ${response.status}: ${err.slice(0, 300)}`); 
  } 
 
  const id = response.headers.get('x-restli-id'); 
  return id; 
} 
 
function extractFirstPost(markdown) { 
  // Extract the first complete LinkedIn post from the markdown file 
  const match = markdown.match(/(?:^|\n)((?:(?!^---+$).)+)/ms); 
  if (!match) return null; 
 
  const post = match[1].trim(); 
  return post.length > 50 ? post : null; 
} 
 
async function main() { 
  const token      = process.env.LINKEDIN_ACCESS_TOKEN; 
  const personUrn  = process.env.LINKEDIN_PERSON_URN; 
 
  if (!token || !personUrn) { 
    console.log('[dist-linkedin.js] LinkedIn credentials not configured. Skipping auto-post.'); 
    console.log('[dist-linkedin.js] Add LINKEDIN_ACCESS_TOKEN and 
LINKEDIN_PERSON_URN to secrets when ready.'); 
    return; 
  } 
 
  const week        = getCurrentWeek(); 
  const contentFile = process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/linkedin-posts.md`; 
  const content     = readText(contentFile); 
 
  if (!content) { 
    console.error('[dist-linkedin.js] Content file not found:', contentFile); 
    process.exit(1); 
  } 
 
  const postText = extractFirstPost(content); 
  if (!postText) { 
    console.error('[dist-linkedin.js] Could not extract post text from content file'); 
    process.exit(1); 
  } 
 
  console.log('[dist-linkedin.js] Posting to LinkedIn...'); 
  console.log('[dist-linkedin.js] Preview:', postText.slice(0, 100), '...'); 
 
  const postId = await postToLinkedIn(postText, personUrn); 
  console.log(`[dist-linkedin.js] Posted. LinkedIn post ID: ${postId}`); 
 
  // Log distribution 
  ensureDir('analytics'); 
  const log = `{"platform":"linkedin","week":"${week}","post_id":"${postId}","posted_at":"${new 
Date().toISOString()}"}\n`; 
  writeFile('analytics/distribution-log.jsonl', (readText('analytics/distribution-log.jsonl') ?? '') + 
log); 
} 
 
main();