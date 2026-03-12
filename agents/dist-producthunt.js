// === FILE: agents/dist-producthunt.js === 
// Job: Product Hunt comment seeding on launch days + listing updates 
// Requires: PRODUCTHUNT_API_TOKEN secret 
// Note: PH submission is always manual — this handles comment drafts 
 
import { readText, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }       from '../lib/week-utils.js'; 
 
async function main() { 
  const week    = getCurrentWeek(); 
  const listing = readText(`campaigns/${week}/marketplace/producthunt-listing.md`); 
 
  if (!listing) { 
    console.log('[dist-producthunt.js] No PH listing found this week. Skipping.'); 
    return; 
  } 
 
  // Write manual instructions with the listing 
  writeFile(`campaigns/${week}/PRODUCTHUNT_MANUAL.md`, 
    `# Product Hunt — Submit and Comment Manually\n\n## Submit at 12:01am PT on 
launch day\n\n${listing}\n\n## Important:\n- Submit at midnight PT (best time for PH 
algorithm)\n- Respond to EVERY comment within 2 hours\n- Ask your network to upvote (not 
for "X" or "Y" — just genuinely if they find it useful)\n`); 
 
  console.log('[dist-producthunt.js] Product Hunt listing and instructions written for manual 
submission.'); 
} 
 
main();