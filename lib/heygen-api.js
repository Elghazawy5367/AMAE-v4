// === FILE: lib/heygen-api.js === 
// Job: HeyGen v2 — submit video rendering jobs + poll for completion 
// Creator plan: $29/month, unlimited avatar videos 
// Requires: HEYGEN_API_KEY, HEYGEN_AVATAR_ID secrets 
 
import { writeJSON, readJSON } from './file-utils.js'; 
 
const HEYGEN_API = 'https://api.heygen.com/v2'; 
 
export async function submitVideoJob(options) { 
  const apiKey  = process.env.HEYGEN_API_KEY; 
  const avatarId = options.avatarId ?? process.env.HEYGEN_AVATAR_ID; 
 
  if (!apiKey)   throw new Error('[heygen-api.js] HEYGEN_API_KEY not set'); 
  if (!avatarId) throw new Error('[heygen-api.js] HEYGEN_AVATAR_ID not set'); 
 
  console.log(`[heygen-api.js] Submitting: ${options.jobName}`); 
 
  const videoInput = { 
    character: { 
      type:      'avatar', 
      avatar_id: avatarId, 
      scale:     1.0, 
    }, 
    background: options.background ?? { type: 'color', value: '#F7F7F7' }, 
  }; 
 
  // Voice: use pre-generated audio file OR text-to-speech 
  if (options.audioUrl) { 
    videoInput.voice = { type: 'audio', audio_url: options.audioUrl }; 
  } else if (options.voiceText) { 
    videoInput.voice = { 
      type:       'text', 
      input_text: options.voiceText, 
      voice_id:   options.heygenVoiceId ?? process.env.HEYGEN_VOICE_ID, 
    }; 
  } 
 
  const body = { 
    video_inputs: [videoInput], 
    dimension: options.portrait 
      ? { width: 1080, height: 1920 }   // Portrait (TikTok/Reels) 
      : { width: 1920, height: 1080 },  // Landscape (YouTube) 
    caption: options.caption ?? true, 
    test:    options.test    ?? false, 
  }; 
 
  const response = await fetch(`${HEYGEN_API}/video/generate`, { 
    method:  'POST', 
    headers: { 
      'X-Api-Key':    apiKey, 
      'Content-Type': 'application/json', 
    }, 
    body: JSON.stringify(body), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[heygen-api.js] API error ${response.status}: ${err.slice(0, 200)}`); 
  } 
 
  const data = await response.json(); 
  return data?.data?.video_id ?? null; 
} 
 
export async function getVideoStatus(videoId) { 
  const apiKey = process.env.HEYGEN_API_KEY; 
  const response = await fetch(`${HEYGEN_API}/video/${videoId}`, { 
    headers: { 'X-Api-Key': apiKey }, 
  }); 
  if (!response.ok) return null; 
  const data = await response.json(); 
  return data?.data ?? null; 
} 
 
// Submit all video jobs from spec, save job IDs for later polling 
export async function submitAllJobs(jobSpecs, jobsFile = 
'campaigns/current/assets/video-jobs/heygen-jobs.json') { 
  const jobs = []; 
 
  for (const spec of jobSpecs) { 
    try { 
      const videoId = await submitVideoJob(spec); 
      jobs.push({ jobName: spec.jobName, videoId, status: 'submitted', submittedAt: new 
Date().toISOString() }); 
      console.log(`[heygen-api.js] Job submitted: ${spec.jobName} → ${videoId}`); 
      await new Promise(r => setTimeout(r, 2000)); // Throttle submissions 
    } catch (err) { 
      console.error(`[heygen-api.js] Failed: ${spec.jobName}:`, err.message); 
      jobs.push({ jobName: spec.jobName, status: 'failed', error: err.message }); 
    } 
  } 
 
  writeJSON(jobsFile, { submitted_at: new Date().toISOString(), jobs }); 
  return jobs; 
}