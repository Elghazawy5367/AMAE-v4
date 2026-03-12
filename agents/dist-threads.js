// === FILE: agents/dist-threads.js === 
// Job: Post to Threads via Threads API (Meta Graph API) 
// Requires: THREADS_ACCESS_TOKEN, THREADS_USER_ID 
 
import { readText }       from '../lib/file-utils.js'; 
import { getCurrentWeek } from '../lib/week-utils.js'; 
 
const THREADS_API = 'https://graph.threads.net/v1.0'; 
 
async function createThreadsPost(token, userId, text) { 
  // Step 1: Create media container 
  const containerRes = await fetch(`${THREADS_API}/${userId}/threads`, { 
    method:  'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body:    JSON.stringify({ text, media_type: 'TEXT', access_token: token }), 
  }); 
  const container = await containerRes.json(); 
  if (!container.id) throw new Error(`[dist-threads.js] Container creation failed: 
${JSON.stringify(container)}`); 
 
  await new Promise(r => setTimeout(r, 30000)); // Threads requires 30s wait 
 
  // Step 2: Publish 
  const publishRes = await fetch(`${THREADS_API}/${userId}/threads_publish`, { 
    method:  'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body:    JSON.stringify({ creation_id: container.id, access_token: token }), 
  }); 
  return publishRes.json(); 
} 
 
async function main() { 
  const token  = process.env.THREADS_ACCESS_TOKEN; 
  const userId = process.env.THREADS_USER_ID; 
 
  if (!token || !userId) { 
    console.log('[dist-threads.js] Threads credentials not configured. Skipping.'); 
    return; 
  } 
 
  const week  = getCurrentWeek(); 
  const posts = readText(`campaigns/${week}/text/threads-posts.md`); 
 
  if (!posts) { 
    console.log('[dist-threads.js] No Threads posts found. Skipping.'); 
    return; 
  } 
 
  const postLines = posts.split('\n') 
    .filter(l => l.match(/^Post \d+:/)) 
    .map(l => l.replace(/^Post \d+:\s*/, '').trim()) 
    .slice(0, 3); // Post first 3 (daily limit management) 
 
  for (const text of postLines) { 
    if (!text) continue; 
    console.log('[dist-threads.js] Posting:', text.slice(0, 50)); 
    await createThreadsPost(token, userId, text); 
    await new Promise(r => setTimeout(r, 60000)); // 1 min between posts 
  } 
 
  console.log('[dist-threads.js] Threads posts published.'); 
} 
 
main();