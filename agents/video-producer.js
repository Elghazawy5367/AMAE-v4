// === FILE: agents/video-producer.js === 
// Job: Submit HeyGen + Runway video jobs, save job IDs for status tracking 
// Reads: campaigns/[WEEK]/text/, campaigns/[WEEK]/assets/audio/ 
// Writes: campaigns/[WEEK]/assets/video-jobs/ 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { submitAllJobs as heygenSubmit } from '../lib/heygen-api.js'; 
import { submitAllBrollJobs }            from '../lib/runway-api.js'; 
import { readJSON, readText, ensureDir } from '../lib/file-utils.js'; 
import { getCurrentWeek }                from '../lib/week-utils.js'; 
 
async function main() { 
  const heygenKey = process.env.HEYGEN_API_KEY; 
  const runwayKey = process.env.RUNWAY_API_KEY; 
 
  if (!heygenKey && !runwayKey) { 
    console.log('[video-producer.js] No HEYGEN_API_KEY or RUNWAY_API_KEY set. 
Skipping video production.'); 
    return; 
  } 
 
  console.log('[video-producer.js] Preparing video production jobs...'); 
 
  const week       = getCurrentWeek(); 
  const videoDir   = `campaigns/${week}/assets/video-jobs`; 
  const audioDir   = `campaigns/${week}/assets/audio`; 
  const imageDir   = `campaigns/${week}/assets/images`; 
  const dna        = readJSON('config/product-dna.json'); 
  const product    = dna.products[dna.active_product]; 
  const videoSpec  = readText('.github/prompts/video-production.prompt.md') ?? ''; 
  const stratBrief = readText(`campaigns/${week}/strategy-brief.md`) ?? ''; 
 
  ensureDir(videoDir); 
 
  if (heygenKey) { 
    // Build HeyGen jobs from available audio files and scripts 
    const heygenJobs = [ 
      { 
        jobName:   'tiktok-video-1', 
        audioUrl:  null, // Will use text-to-speech if no MP3 available 
        voiceText: readText(`campaigns/${week}/text/tiktok-scripts.md`)?.slice(0, 500) ?? '', 
        portrait:  true, 
        caption:   true, 
      }, 
    ]; 
 
    console.log(`[video-producer.js] Submitting ${heygenJobs.length} HeyGen jobs...`); 
    await heygenSubmit(heygenJobs, `${videoDir}/heygen-jobs.json`); 
  } 
 
  console.log('[video-producer.js] Video jobs submitted. Check video-jobs/ for status.'); 
} 
 
main();