// === FILE: agents/dist-pinterest.js === 
// Job: Create Pinterest pins via Pinterest API v5 
// Requires: PINTEREST_ACCESS_TOKEN, PINTEREST_BOARD_ID 
 
import { readText, ensureDir, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }                  from '../lib/week-utils.js'; 
 
const PIN_API = 'https://api.pinterest.com/v5'; 
 
async function createPin(token, boardId, title, description, imageUrl, link = null) { 
  const body = { 
    title, 
    description, 
    board_id: boardId, 
    media_source: { source_type: 'image_url', url: imageUrl }, 
  }; 
  if (link) body.link = link; 
 
  const response = await fetch(`${PIN_API}/pins`, { 
    method:  'POST', 
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
    body:    JSON.stringify(body), 
  }); 
  return response.json(); 
} 
 
async function main() { 
  const token   = process.env.PINTEREST_ACCESS_TOKEN; 
  const boardId = process.env.PINTEREST_BOARD_ID; 
 
  if (!token || !boardId) { 
    console.log('[dist-pinterest.js] Pinterest credentials not configured. Skipping.'); 
    return; 
  } 
 
  const week    = getCurrentWeek(); 
  const content = readText(process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/pinterest-pins.md`); 
 
  if (!content) { 
    console.log('[dist-pinterest.js] No Pinterest content found. Skipping.'); 
    return; 
  } 
 
  console.log('[dist-pinterest.js] Pinterest requires generated pin images. Check 
assets/generated/ for PNG files.'); 
  // Full implementation loops through pin specs + image files and creates pins 
} 
 
main();