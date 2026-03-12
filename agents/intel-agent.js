// === FILE: agents/intel-agent.js === 
// Job: First campaign step — reads synthesis brief and prepares context for strategy-agent 
// Reads: intelligence/weekly/synthesis-brief.md, memory/insights.json 
// Writes: campaigns/[WEEK]/intel-brief.md 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { readText, readJSON, writeText, ensureDir } from '../lib/file-utils.js'; 
import { getIntelFolder, getCampaignFolder, getTodayString, getCurrentWeek } from 
'../lib/week-utils.js'; 
 
async function main() { 
  console.log('[intel-agent] Preparing intelligence context for campaign...'); 
 
  const intelDir    = getIntelFolder(); 
  const campaignDir = getCampaignFolder(); 
  ensureDir(campaignDir); 
 
  const synthBrief = readText(`${intelDir}/synthesis-brief.md`); 
  const copyAmmo   = readText(`${intelDir}/copy-ammunition.md`); 
  const timing     = readJSON(`${intelDir}/timing-windows.json`) ?? {}; 
  const insights   = readJSON('memory/insights.json') ?? {}; 
 
  let briefContent; 
 
  if (!synthBrief) { 
    console.log('[intel-agent] No synthesis brief found — this is Week 1 or Tuesday workflow 
has not run yet.'); 
    briefContent = [ 
      `# Intel Brief — ${getCurrentWeek()}`, 
      `_Generated: ${getTodayString()}_`, 
      '', 
      '## Status', 
      'No intelligence brief available. Tuesday mining workflow has not run yet, or this is the 
first run.', 
      '', 
      '## Fallback Instructions for Campaign Engine', 
      'Use the_desire section from config/product-dna.json as the source of all copy 
language.', 
      'Generate TOFU awareness content on the primary platform.', 
      'Focus on channeling the audience\'s exact frustration in their own words.', 
      '', 
      '## Memory Recommendation', 
      insights.recommendation ?? 'No performance data yet.', 
    ].join('\n'); 
  } else { 
    // Extract the verbatim hook from synthesis brief for convenience 
    const hookMatch = synthBrief.match(/\*\*\[HOOK\]\*\*:?\s*(.+)/i) ?? 
synthBrief.match(/\[HOOK\][:]\s*(.+)/i); 
    const verbatimHook = hookMatch?.[1]?.trim() ?? null; 
 
    briefContent = [ 
      `# Intel Brief — ${getCurrentWeek()}`, 
      `_Generated: ${getTodayString()}_`, 
      '', 
      '## This Week\'s Synthesis Brief', 
      synthBrief, 
      '', 
      '---', 
      '', 
      '## Campaign Engine Parameters', 
      `**Verbatim Hook Extracted:** ${verbatimHook ?? 'See synthesis brief above'}`, 
      `**Memory Recommendation:** ${insights.recommendation ?? 'TOFU content on primary 
platform'}`, 
      `**Platforms With Resonance:** ${insights.platforms_with_resonance?.join(', ') ?? 'None 
tracked yet'}`, 
      `**Funnel Warning:** ${insights.alert === 'desire_section_needs_revision' ? 'ALERT: 
Desire section needs revision' : 'None'}`, 
    ].join('\n'); 
  } 
 
  writeText(`${campaignDir}/intel-brief.md`, briefContent); 
  console.log('[intel-agent] Intel brief written to campaign folder.'); 
} 
 
main();