// === FILE: agents/dist-youtube.js === 
// Job: Upload Shorts/videos to YouTube Data API v3 
// Requires: YOUTUBE_ACCESS_TOKEN, YOUTUBE_CHANNEL_ID 
// Note: YouTube requires actual video files from HeyGen 
 
import { readText }       from '../lib/file-utils.js'; 
import { getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  const token = process.env.YOUTUBE_ACCESS_TOKEN; 
  const week  = getCurrentWeek(); 
 
  if (!token) { 
    console.log('[dist-youtube.js] YouTube credentials not configured. Skipping.'); 
    return; 
  } 
 
  // YouTube upload requires actual MP4 file from HeyGen/Runway 
  // Check if video jobs completed 
  const heygenJobs = readText(`campaigns/${week}/assets/video-jobs/heygen-jobs.json`); 
  if (!heygenJobs) { 
    console.log('[dist-youtube.js] No HeyGen video jobs found. Skipping YouTube upload.'); 
    return; 
  } 
 
  console.log('[dist-youtube.js] YouTube upload requires completed HeyGen video.'); 
  console.log('[dist-youtube.js] Download video from HeyGen dashboard and upload 
manually, or re-run after video completion.'); 
} 
 
main();