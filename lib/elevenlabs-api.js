// === FILE: lib/elevenlabs-api.js === 
// Job: ElevenLabs TTS — generates MP3 voiceovers for video scripts 
// Free: 10,000 characters/month → Creator plan $11/month for more 
// Requires: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID secrets 
 
import fs from 'fs'; 
import path from 'path'; 
import { ensureDir } from './file-utils.js'; 
 
const EL_API = 'https://api.elevenlabs.io/v1/text-to-speech'; 
 
export async function generateVoiceover(text, options = {}) { 
  const apiKey  = process.env.ELEVENLABS_API_KEY; 
  const voiceId = options.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? 
'pNInz6obpgDQGcFmaJgB'; // Adam (default) 
 
  if (!apiKey) throw new Error('[elevenlabs-api.js] ELEVENLABS_API_KEY not set'); 
 
  console.log(`[elevenlabs-api.js] Generating voiceover: ${text.slice(0, 50)}...`); 
 
  const response = await fetch(`${EL_API}/${voiceId}`, { 
    method:  'POST', 
    headers: { 
      'xi-api-key':   apiKey, 
      'Content-Type': 'application/json', 
    }, 
    body: JSON.stringify({ 
      text, 
      model_id: 'eleven_turbo_v2_5', 
      voice_settings: { 
        stability:        options.stability        ?? 0.5, 
        similarity_boost: options.similarity_boost ?? 0.75, 
        style:            options.energy           ?? 0.4,   // 0=calm, 1=energetic 
        use_speaker_boost: true, 
      }, 
    }), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[elevenlabs-api.js] API error ${response.status}: ${err.slice(0, 200)}`); 
  } 
 
  const buffer = await response.arrayBuffer(); 
 
  if (options.outputPath) { 
    ensureDir(path.dirname(options.outputPath)); 
    fs.writeFileSync(options.outputPath, Buffer.from(buffer)); 
    console.log(`[elevenlabs-api.js] Saved: ${options.outputPath}`); 
    return options.outputPath; 
  } 
 
  return Buffer.from(buffer); 
} 
 
// Generate voiceovers for all scripts in batch 
export async function generateAllVoiceovers(scripts) { 
  const results = []; 
 
  for (const script of scripts) { 
    try { 
      const result = await generateVoiceover(script.text, { 
        outputPath: script.outputPath, 
        energy:     script.energy ?? 0.4, 
      }); 
      results.push({ outputPath: script.outputPath, success: true }); 
 
      // Rate limit buffer 
      await new Promise(r => setTimeout(r, 1000)); 
    } catch (err) { 
      console.error(`[elevenlabs-api.js] Failed: ${script.outputPath}:`, err.message); 
      results.push({ outputPath: script.outputPath, success: false, error: err.message }); 
    } 
  } 
 
  return results; 
} 
 
// Get remaining character quota 
export async function getQuotaRemaining() { 
  const apiKey = process.env.ELEVENLABS_API_KEY; 
  if (!apiKey) return null; 
 
  const response = await fetch('https://api.elevenlabs.io/v1/user', { 
    headers: { 'xi-api-key': apiKey }, 
  }); 
  if (!response.ok) return null; 
  const data = await response.json(); 
  return data?.subscription?.character_limit - data?.subscription?.character_count; 
}