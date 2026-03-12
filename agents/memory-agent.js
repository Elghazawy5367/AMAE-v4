// === FILE: agents/memory-agent.js === 
// Job: Read performance data and update memory files before each campaign run 
// Reads: memory/performance.json, analytics/distribution-log.jsonl 
// Writes: memory/insights.json, memory/hook-performance.json 
// Called by: .github/workflows/weekly-campaign.yml (first step) 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, writeJSON }          from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[memory-agent] Updating memory from performance data...'); 
 
  const performance  = readJSON('memory/performance.json')  ?? { weeks_tracked: 0 }; 
  const existing     = readJSON('memory/insights.json')     ?? {}; 
  const hookPerf     = readJSON('memory/hook-performance.json') ?? { formulas_tested: [] }; 
  // JSONL files cannot be parsed with JSON.parse() — must parse line by line
  let distLog = { distributions: [] };
  try {
    const raw = readText('analytics/distribution-log.jsonl') ?? '';
    distLog.distributions = raw.split('
')
      .filter(l => l.trim())
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { /* file doesn't exist yet */ } 
 
  const weeksTracked = performance.weeks_tracked ?? 0; 
  const weeksNoRes   = existing.weeks_without_resonance ?? 0; 
 
  // ── First-run or no data 
─────────────────────────────────────────────────── 
  if (weeksTracked === 0) { 
    const starter = { 
      last_updated:             getTodayString(), 
      week:                     getCurrentWeek(), 
      weeks_without_resonance:  weeksNoRes + 1, 
      what_is_working:          [], 
      what_is_not_working:      [], 
      top_performing_hooks:     [], 
      platforms_with_resonance: [], 
      recommendation:           weeksNoRes >= 6 
        ? 'WARNING: 6+ weeks without resonance signals. The problem is NOT the content or 
platform — it is the the_desire section of product-dna.json. The audience desire is not 
specific enough. Run the Desire Discovery Protocol: read 50 posts in your subreddits and 
answer the 4 questions again from scratch.' 
        : 'No performance data yet. Default: TOFU awareness content on primary platform. 
Focus on channeling the exact language in copy-ammunition.md.', 
    }; 
    writeJSON('memory/insights.json', starter); 
    console.log('[memory-agent] No performance data. Starter written.'); 
    return; 
  } 
 
  // ── Synthesize performance data with AI 
─────────────────────────────────── 
  const prompt = `You are summarizing marketing performance for a solo founder. 
 
PERFORMANCE DATA: 
${JSON.stringify(performance, null, 2)} 
 
DISTRIBUTION LOG (last 5 entries): 
${JSON.stringify(distLog.distributions?.slice(-5), null, 2)} 
 
EXISTING INSIGHTS: 
${JSON.stringify(existing, null, 2)} 
 
HOOK PERFORMANCE: 
${JSON.stringify(hookPerf, null, 2)} 
 
Analyze and output a JSON object with exactly these fields: 
{ 
  "what_is_working": ["specific observation 1", "specific observation 2"], 
  "what_is_not_working": ["specific observation 1"], 
  "top_performing_hooks": ["hook formula name 1", "hook formula name 2"], 
  "platforms_with_resonance": ["platform name"], 
  "recommendation": "ONE specific sentence for next week's campaign", 
  "weeks_without_resonance": <number>, 
  "alert": null or "6_week_warning" or "desire_section_needs_revision" 
} 
 
Rules: 
- If resonance_signals_total > 0: weeks_without_resonance resets to 0 
- If resonance_signals_total is 0 for 6+ weeks: set alert to "desire_section_needs_revision" 
- Keep all string values specific and actionable, not generic 
- Output ONLY the JSON object. No commentary.`; 
 
  console.log('[memory-agent] Synthesizing performance data...'); 
 
  try { 
    const response = await callModel([{ role: 'user', content: prompt }], MODELS.FAST, 800, 
0.3); 
    const parsed   = parseJSON(response); 
 
    writeJSON('memory/insights.json', { 
      ...parsed, 
      last_updated:  getTodayString(), 
      week:          getCurrentWeek(), 
      weeks_tracked: weeksTracked, 
    }); 
 
    if (parsed.alert === 'desire_section_needs_revision') { 
      console.log('[memory-agent] ALERT: 6+ weeks without resonance. product-dna.json 
the_desire section needs revision.'); 
    } 
 
    console.log('[memory-agent] insights.json updated successfully.'); 
  } catch (err) { 
    console.error('[memory-agent] Parse error — preserving existing insights:', err.message); 
    writeJSON('memory/insights.json', { ...existing, last_updated: getTodayString(), 
parse_error: err.message }); 
  } 
} 
 
main();