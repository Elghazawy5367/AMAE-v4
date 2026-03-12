// === FILE: lib/instagram-api.js ===
// Instagram Graph API wrapper
// GAP-005 FIX: File was absent; agents must use lib wrappers per architecture rules
//
// Used by: agents/dist-instagram.js
// Requires: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID

const IG_API = 'https://graph.facebook.com/v21.0';

export async function createMediaObject(accountId, token, imageUrl, caption) {
  const response = await fetch(`${IG_API}/${accountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`IG createMedia failed: ${response.status} — ${JSON.stringify(err)}`);
  }
  const data = await response.json();
  return data.id;
}

export async function publishMedia(accountId, token, creationId) {
  const response = await fetch(`${IG_API}/${accountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`IG publishMedia failed: ${response.status} — ${JSON.stringify(err)}`);
  }
  const data = await response.json();
  return data.id;
}

export async function getAccountInfo(accountId, token) {
  const response = await fetch(
    `${IG_API}/${accountId}?fields=id,username,followers_count&access_token=${token}`
  );
  if (!response.ok) throw new Error(`IG getAccount failed: ${response.status}`);
  return response.json();
}
