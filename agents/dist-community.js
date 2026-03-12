// === FILE: agents/dist-community.js === 
// Job: Prepare community seeding content for manual posting 
// Reads: campaigns/[WEEK]/text/community-seeds.md 
// Writes: campaigns/[WEEK]/COMMUNITY_MANUAL_POSTS.md 
 
import { readText, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }       from '../lib/week-utils.js'; 
 
async function main() { 
  const week    = getCurrentWeek(); 
  const content = readText(`campaigns/${week}/text/community-seeds.md`); 
 
  if (!content) { 
    console.log('[dist-community.js] No community content found. Skipping.'); 
    return; 
  } 
 
  writeFile(`campaigns/${week}/COMMUNITY_MANUAL_POSTS.md`, 
    `# Community Seeding — Post Manually\n\n> These posts must be posted by a human. 
Never auto-post to communities.\n> Join the community, contribute first, then 
post.\n\n${content}`); 
 
  console.log('[dist-community.js] Community posts prepared for manual distribution.'); 
} 
 
main();