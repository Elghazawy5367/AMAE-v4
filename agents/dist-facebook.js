// === FILE: agents/dist-facebook.js === 
// Job: Post to Facebook Page via Graph API 
// Requires: FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID 
 
import { readText }        from '../lib/file-utils.js'; 
import { getCurrentWeek }  from '../lib/week-utils.js'; 
 
const FB_API = 'https://graph.facebook.com/v21.0'; 
 
async function main() { 
  const token  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN; 
  const pageId = process.env.FACEBOOK_PAGE_ID; 
 
  if (!token || !pageId) { 
    console.log('[dist-facebook.js] Facebook credentials not configured. Skipping.'); 
    return; 
  } 
 
  const week    = getCurrentWeek(); 
  const content = readText(process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/facebook-post.md`); 
 
  if (!content) { 
    console.log('[dist-facebook.js] No Facebook content found. Skipping.'); 
    return; 
  } 
 
  const pagePostMatch = content.match(/=== PAGE POST ===([\s\S]+?)(?:===|$)/); 
  const postText      = pagePostMatch?.[1]?.trim(); 
 
  if (!postText) { 
    console.log('[dist-facebook.js] Could not parse page post from content.'); 
    return; 
  } 
 
  console.log('[dist-facebook.js] Posting to Facebook Page...'); 
 
  const response = await fetch(`${FB_API}/${pageId}/feed`, { 
    method:  'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body:    JSON.stringify({ message: postText, access_token: token }), 
  }); 
 
  const data = await response.json(); 
  if (data.error) { 
    console.error('[dist-facebook.js] API error:', data.error.message); 
    process.exit(1); 
  } 
 
  console.log('[dist-facebook.js] Posted. Post ID:', data.id); 
} 
 
main();