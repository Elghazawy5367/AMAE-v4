// === FILE: lib/runway-api.js === 
// Job: Runway Gen-3 — image-to-video B-roll generation 
// Standard plan: $12/month, 125 credits/month 
// Requires: RUNWAY_API_KEY secret 
 
import { writeJSON } from './file-utils.js'; 
 
const RUNWAY_API = 'https://api.dev.runwayml.com/v1'; 
 
export async function submitImageToVideoJob(options) { 
  const apiKey = process.env.RUNWAY_API_KEY; 
  if (!apiKey) throw new Error('[runway-api.js] RUNWAY_API_KEY not set'); 
 
  console.log(`[runway-api.js] Submitting B-roll: ${options.outputFilename}`); 
 
  const response = await fetch(`${RUNWAY_API}/image_to_video`, { 
    method:  'POST', 
    headers: { 
      'Authorization':  `Bearer ${apiKey}`, 
      'Content-Type':   'application/json', 
      'X-Runway-Version': '2024-11-06', 
    }, 
    body: JSON.stringify({ 
      promptImage:   options.imageUrl, 
      promptText:    options.motionPrompt ?? 'Subtle, smooth camera movement. 
Professional.', 
      model:         'gen3a_turbo', 
      duration:      options.durationSeconds ?? 5, 
      ratio:         options.portrait ? '768:1280' : '1280:768', 
      watermark:     false, 
    }), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[runway-api.js] API error ${response.status}: ${err.slice(0, 200)}`); 
  } 
 
  const data = await response.json(); 
  return data?.id ?? null; 
} 
 
export async function getJobStatus(jobId) { 
  const apiKey = process.env.RUNWAY_API_KEY; 
  const response = await fetch(`${RUNWAY_API}/tasks/${jobId}`, { 
    headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' }, 
  }); 
  if (!response.ok) return null; 
  return response.json(); 
} 
 
export async function submitAllBrollJobs(specs, jobsFile = 
'campaigns/current/assets/video-jobs/runway-jobs.json') { 
  const jobs = []; 
  for (const spec of specs) { 
    try { 
      const jobId = await submitImageToVideoJob(spec); 
      jobs.push({ outputFilename: spec.outputFilename, jobId, status: 'submitted', submittedAt: 
new Date().toISOString() }); 
      await new Promise(r => setTimeout(r, 3000)); 
    } catch (err) { 
      console.error(`[runway-api.js] Failed: ${spec.outputFilename}:`, err.message); 
      jobs.push({ outputFilename: spec.outputFilename, status: 'failed', error: err.message }); 
    } 
  } 
  writeJSON(jobsFile, { jobs }); 
  return jobs; 
}