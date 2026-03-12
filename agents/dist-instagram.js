// === FILE: agents/dist-instagram.js === 
// Job: Post to Instagram via Graph API (Reels require video file) 
// Requires: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID 
// Note: Reels need video file — only captions auto-posted if no video generated yet 
 
import { readText, ensureDir, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }                  from '../lib/week-utils.js'; 
 
const IG_API = 'https://graph.facebook.com/v21.0'; 
 
async function createMediaObject(accountId, token, imageUrl, caption) { 
  const response = await fetch(`${IG_API}/${accountId}/media`, { 
    method:  'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body:    JSON.stringify({ image_url: imageUrl, caption, access_token: token }), 
  }); 
  const data = await response.json(); 
  return data.id; 
} 
 
async function publishMedia(accountId, token, creationId) { 
  const response = await fetch(`${IG_API}/${accountId}/media_publish`, { 
    method:  'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body:    JSON.stringify({ creation_id: creationId, access_token: token }), 
  }); 
  return response.json(); 
} 
 
async function main() { 
  const token     = process.env.INSTAGRAM_ACCESS_TOKEN; 
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID; 
 
  if (!token || !accountId) { 
    console.log('[dist-instagram.js] Instagram credentials not configured. Skipping.'); 
    return; 
  } 
 
  const week    = getCurrentWeek(); 
  const content = readText(process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/instagram-reels-scripts.md`); 
 
  if (!content) { 
    console.log('[dist-instagram.js] No Instagram content found. Skipping.'); 
    return; 
  } 
 
  // Extract first caption 
  const captionMatch = content.match(/caption:\s*(.+?)(?=\n|$)/i); 
  const caption      = captionMatch?.[1] ?? ''; 
 
  if (!caption) { 
    console.log('[dist-instagram.js] No caption extracted. Skipping.'); 
    return; 
  } 
 
  console.log('[dist-instagram.js] NOTE: Image upload requires generated image file.'); 
  console.log('[dist-instagram.js] Caption ready:', caption.slice(0, 100)); 
  // Full implementation requires image URL from assets/generated/ 
} 
 
main();