// === FILE: agents/dist-twitter-x.js === 
// Job: Post Twitter/X thread via X API v2 
// Requires: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, 
TWITTER_ACCESS_SECRET 
 
import crypto from 'crypto'; 
import { readText, readJSON, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getCurrentWeek } from '../lib/week-utils.js'; 
 
const X_API = 'https://api.twitter.com/2/tweets'; 
 
function generateOAuthHeader(method, url, oauthParams, signingKey) { 
  const paramString = Object.keys(oauthParams).sort() 
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`) 
    .join('&'); 
  const baseString = 
`${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`; 
  const signature  = crypto.createHmac('sha1', 
signingKey).update(baseString).digest('base64'); 
 
  return `OAuth ${Object.keys(oauthParams).sort().map(k => 
    `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"` 
  ).join(', ')}, oauth_signature="${encodeURIComponent(signature)}"`; 
} 
 
async function postTweet(text, replyToId = null) { 
  const apiKey       = process.env.TWITTER_API_KEY; 
  const apiSecret    = process.env.TWITTER_API_SECRET; 
  const accessToken  = process.env.TWITTER_ACCESS_TOKEN; 
  const accessSecret = process.env.TWITTER_ACCESS_SECRET; 
 
  if (!apiKey || !accessToken) throw new Error('[dist-twitter-x.js] X API credentials not set'); 
 
  const nonce     = crypto.randomBytes(16).toString('hex'); 
  const timestamp = Math.floor(Date.now() / 1000).toString(); 
 
  const oauthParams = { 
    oauth_consumer_key:     apiKey, 
    oauth_nonce:            nonce, 
    oauth_signature_method: 'HMAC-SHA1', 
    oauth_timestamp:        timestamp, 
    oauth_token:            accessToken, 
    oauth_version:          '1.0', 
  }; 
 
  const signingKey  = 
`${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`; 
  const authHeader  = generateOAuthHeader('POST', X_API, oauthParams, signingKey); 
 
  const body = { text }; 
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId }; 
 
  const response = await fetch(X_API, { 
    method:  'POST', 
    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader }, 
    body:    JSON.stringify(body), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[dist-twitter-x.js] API error ${response.status}: ${err.slice(0, 300)}`); 
  } 
 
  const data = await response.json(); 
  return data.data?.id; 
} 
 
function parseTweets(markdown) { 
  const lines = markdown.split('\n'); 
  return lines 
    .filter(l => l.match(/^Tweet \d+:/)) 
    .map(l => l.replace(/^Tweet \d+:\s*/, '').trim()) 
    .filter(t => t.length > 0); 
} 
 
async function main() { 
  const apiKey = process.env.TWITTER_API_KEY; 
  if (!apiKey) { 
    console.log('[dist-twitter-x.js] X API credentials not configured. Skipping.'); 
    return; 
  } 
 
  const week        = getCurrentWeek(); 
  const contentFile = process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/twitter-x-threads.md`; 
  const content     = readText(contentFile); 
 
  if (!content) { 
    console.error('[dist-twitter-x.js] Content file not found:', contentFile); 
    process.exit(1); 
  } 
 
  const tweets = parseTweets(content); 
  if (!tweets.length) { 
    console.error('[dist-twitter-x.js] No tweets found in content file'); 
    process.exit(1); 
  } 
 
  console.log(`[dist-twitter-x.js] Posting thread: ${tweets.length} tweets...`); 
 
  let previousId = null; 
  for (const tweet of tweets) { 
    const tweetId = await postTweet(tweet, previousId); 
    console.log(`[dist-twitter-x.js] Tweet posted: ${tweetId}`); 
    previousId = tweetId; 
    await new Promise(r => setTimeout(r, 2000)); // 2s between tweets 
  } 
 
  console.log('[dist-twitter-x.js] Thread posted successfully.'); 
} 
 
main();