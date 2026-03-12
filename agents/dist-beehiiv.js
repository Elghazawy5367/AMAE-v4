// === FILE: agents/dist-beehiiv.js === 
// Job: Create newsletter draft in Beehiiv — NEVER sends automatically 
// Requires: BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID secrets 
// HUMAN SENDS: founder reviews draft in Beehiiv dashboard, then sends manually 
 
import { readText, ensureDir, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }                  from '../lib/week-utils.js'; 
 
const BH_API = 'https://api.beehiiv.com/v2'; 
 
function parseNewsletter(markdown) { 
  const subjectMatch = markdown.match(/^SUBJECT LINE:\s*(.+)$/m); 
  const previewMatch = markdown.match(/^PREVIEW TEXT:\s*(.+)$/m); 
  const bodyStart    = markdown.indexOf('---\n'); 
  const body         = bodyStart !== -1 ? markdown.slice(bodyStart + 4).trim() : markdown; 
 
  return { 
    subject:  subjectMatch?.[1]?.trim() ?? 'This week from AMAE', 
    preview:  previewMatch?.[1]?.trim() ?? '', 
    body, 
  }; 
} 
 
async function createDraft(subject, previewText, contentMarkdown) { 
  const apiKey       = process.env.BEEHIIV_API_KEY; 
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID; 
 
  if (!apiKey || !publicationId) { 
    throw new Error('[dist-beehiiv.js] BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID 
required'); 
  } 
 
  const response = await fetch(`${BH_API}/publications/${publicationId}/posts`, { 
    method:  'POST', 
    headers: { 
      'Content-Type':  'application/json', 
      'Authorization': `Bearer ${apiKey}`, 
    }, 
    body: JSON.stringify({ 
      status:          'draft', 
      title:           subject, 
      subtitle:        previewText, 
      content_markdown: contentMarkdown, 
      content_tags:    ['weekly-campaign'], 
    }), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[dist-beehiiv.js] API error ${response.status}: ${err.slice(0, 300)}`); 
  } 
 
  const data = await response.json(); 
  return data.data?.id; 
} 
 
async function main() { 
  const apiKey = process.env.BEEHIIV_API_KEY; 
  if (!apiKey) { 
    console.log('[dist-beehiiv.js] Beehiiv credentials not configured. Skipping draft creation.'); 
    return; 
  } 
 
  const week        = getCurrentWeek(); 
  const contentFile = process.env.CONTENT_FILE ?? 
`campaigns/${week}/text/newsletter.md`; 
  const content     = readText(contentFile); 
 
  if (!content) { 
    console.log('[dist-beehiiv.js] Newsletter file not found. Skipping.'); 
    return; 
  } 
 
  const { subject, preview, body } = parseNewsletter(content); 
 
  console.log('[dist-beehiiv.js] Creating newsletter draft in Beehiiv...'); 
  console.log('[dist-beehiiv.js] Subject:', subject); 
  console.log('[dist-beehiiv.js] NOTE: This creates a DRAFT only. You must review and send 
manually.'); 
 
  const draftId = await createDraft(subject, preview, body); 
  console.log(`[dist-beehiiv.js] Draft created. Beehiiv post ID: ${draftId}`); 
  console.log(`[dist-beehiiv.js] Review at: https://app.beehiiv.com/posts/${draftId}`); 
} 
 
main();