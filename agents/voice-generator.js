// === FILE: agents/voice-generator.js === 
// Job: Generate MP3 voiceovers from video scripts using ElevenLabs 
// Reads: campaigns/[WEEK]/text/tiktok-scripts.md, youtube-*-scripts.md 
// Writes: campaigns/[WEEK]/assets/audio/*.mp3 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { generateAllVoiceovers, getQuotaRemaining } from '../lib/elevenlabs-api.js'; 
import { readText, ensureDir }                      from '../lib/file-utils.js'; 
import { getCurrentWeek }                           from '../lib/week-utils.js'; 
 
function extractVoiceoversFromScript(markdown, prefix) { 
  const scripts = []; 
  const sections = markdown.split(/^=== .+ ===$|^Script \d+:/m).filter(s => s.trim().length > 
50); 
 
  sections.forEach((section, i) => { 
    const voMatch = section.match(/VOICEOVER:\s*(.+?)(?=VISUAL:|TEXT 
OVERLAY:|SOUND:|$)/si); 
    if (voMatch) { 
      scripts.push({ 
        text:       voMatch[1].trim().slice(0, 2000), 
        outputPath: `${prefix}-${i + 1}.mp3`, 
        energy:     0.5, 
      }); 
    } 
  }); 
 
  return scripts; 
} 
 
async function main() { 
  const apiKey = process.env.ELEVENLABS_API_KEY; 
  if (!apiKey) { 
    console.log('[voice-generator.js] ELEVENLABS_API_KEY not set. Skipping voice 
generation.'); 
    return; 
  } 
 
  console.log('[voice-generator.js] Checking quota...'); 
  const remaining = await getQuotaRemaining(); 
  console.log(`[voice-generator.js] Characters remaining: ${remaining ?? 'unknown'}`); 
 
  if (remaining !== null && remaining < 500) { 
    console.log('[voice-generator.js] Insufficient quota. Skipping voice generation.'); 
    return; 
  } 
 
  const week      = getCurrentWeek(); 
  const audioDir  = `campaigns/${week}/assets/audio`; 
  ensureDir(audioDir); 
 
  const scripts = []; 
 
  const tiktokScripts = readText(`campaigns/${week}/text/tiktok-scripts.md`) ?? ''; 
  if (tiktokScripts) { 
    scripts.push(...extractVoiceoversFromScript(tiktokScripts, `${audioDir}/tiktok-vo`)); 
  } 
 
  const shortScripts = readText(`campaigns/${week}/text/youtube-short-scripts.md`) ?? ''; 
  if (shortScripts) { 
    scripts.push(...extractVoiceoversFromScript(shortScripts, `${audioDir}/youtube-short-vo`)); 
  } 
 
  const longScript = readText(`campaigns/${week}/text/youtube-long-script.md`) ?? ''; 
  if (longScript) { 
    const longVo = longScript.match(/VOICEOVER[^:]*:\s*(.{200,})/si)?.[1]?.slice(0, 3000); 
    if (longVo) scripts.push({ text: longVo, outputPath: `${audioDir}/youtube-long-vo.mp3`, 
energy: 0.4 }); 
  } 
 
  if (scripts.length === 0) { 
    console.log('[voice-generator.js] No voiceover scripts found. Skipping.'); 
    return; 
  } 
 
  console.log(`[voice-generator.js] Generating ${scripts.length} voiceovers...`); 
  const results = await generateAllVoiceovers(scripts); 
  const succeeded = results.filter(r => r.success).length; 
  console.log(`[voice-generator.js] Done. ${succeeded}/${scripts.length} voiceovers 
generated.`); 
} 
 
main();