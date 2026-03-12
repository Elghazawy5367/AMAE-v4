// === FILE: agents/dist-tiktok.js === 
// Job: Post to TikTok via Content Posting API (requires video file) 
// Requires: TIKTOK_ACCESS_TOKEN 
// Note: TikTok requires an actual video file — scripts are flagged for manual recording 
 
import { readText, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }       from '../lib/week-utils.js'; 
 
async function main() { 
  const token = process.env.TIKTOK_ACCESS_TOKEN; 
  const week  = getCurrentWeek(); 
 
  if (!token) { 
    console.log('[dist-tiktok.js] TikTok credentials not configured.'); 
  } 
 
  // TikTok requires a video file — flag scripts for manual recording 
  const scripts = readText(`campaigns/${week}/text/tiktok-scripts.md`); 
  if (scripts) { 
    writeFile(`campaigns/${week}/TIKTOK_MANUAL_RECORD.md`, 
      `# TikTok — Record and Post Manually\n\nScripts ready. Record video using these 
scripts, then upload via TikTok app.\n\n${scripts}`); 
    console.log('[dist-tiktok.js] TikTok scripts flagged for manual recording.'); 
  } 
} 
 
main();