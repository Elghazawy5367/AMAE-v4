// === FILE: lib/tweet-utils.js ===
// Twitter/X OAuth 1.0a signing utilities + thread parsing
// GAP-006 FIX: File was absent; OAuth signing logic must live in lib wrapper
//
// Used by: agents/dist-twitter-x.js

import crypto from 'crypto';

export function buildOAuthHeader(method, url, params, credentials) {
  const { apiKey, apiSecret, accessToken, accessSecret } = credentials;

  const oauthParams = {
    oauth_consumer_key:     apiKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramStr = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const sigBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramStr),
  ].join('&');

  const sigKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
  const signature = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64');
  oauthParams.oauth_signature = signature;

  return 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');
}

// Parse a markdown thread file split on '---' separators
export function parseThread(markdownContent) {
  return markdownContent
    .split(/^---$/m)
    .map(t => t.trim())
    .filter(t => t.length > 0 && t.length <= 280);
}

// Validate thread length and first-tweet rules
export function validateThread(tweets) {
  const issues = [];
  if (tweets.length < 3)  issues.push('Thread too short (min 3 tweets)');
  if (tweets.length > 15) issues.push('Thread too long (max 15 tweets)');
  if (tweets[0]?.length > 280) issues.push('First tweet exceeds 280 chars');
  if (/https?:\/\//.test(tweets[0] ?? '')) issues.push('First tweet contains link — remove it');
  return { valid: issues.length === 0, issues };
}
