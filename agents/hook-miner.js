// === FILE: agents/hook-miner.js === 
// Job: Match best hook formula to this week's angle 
// Reads: intelligence/patterns/hook-formulas.md, intelligence/weekly/copy-ammunition.md 
// Writes: intelligence/weekly/hook-recommendation.json 
// Called by: .github/workflows/weekly-intelligence.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, readText, writeJSON, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[hook-miner.js] Mining best hook formula for this week...'); 
 
  const dna         = readJSON('config/product-dna.json'); 
  const product     = dna.products[dna.active_product]; 
  const hookLib     = readText('intelligence/patterns/hook-formulas.md') ?? ''; 
  const copyAmmo    = readText('intelligence/weekly/copy-ammunition.md') ?? ''; 
  const timingWin   = readJSON('intelligence/weekly/timing-windows.json') ?? {}; 
  const memInsights = readJSON('memory/hook-performance.json') ?? {}; 
 
  if (!copyAmmo) { 
    console.log('[hook-miner.js] No copy-ammunition.md yet. Run copy-excavator first.'); 
    return; 
  } 
 
  const prompt = `You are selecting the best hook formula for this week's marketing 
campaign. 
 
PRODUCT: ${product.name} 
ICP: ${product.icp?.primary ?? ''} 
BRAND VOICE: ${product.brand_voice?.sounds_like ?? ''} 
NEVER SAY: ${JSON.stringify(product.brand_voice?.never_say ?? [])} 
 
HOOK FORMULA LIBRARY: 
${hookLib.slice(0, 3000)} 
 
THIS WEEK'S COPY AMMUNITION (Tier 1 verbatim phrases): 
${copyAmmo.slice(0, 2000)} 
 
TIMING CONTEXT: 
${JSON.stringify(timingWin.publish_now_window ?? [], null, 2).slice(0, 1000)} 
 
HOOK PERFORMANCE HISTORY: 
${JSON.stringify(memInsights.best_performing ?? 'No data yet')} 
 
Select the best hook formula for each platform and write fully-formed hook options using the 
verbatim phrases above. 
 
Return ONLY valid JSON: 
{ 
  "platform_hooks": { 
    "linkedin": { "formula_used": "", "option_1": "", "option_2": "", "source_phrase": "", 
"confidence": "" }, 
    "twitter_x": { "formula_used": "", "option_1": "", "option_2": "", "source_phrase": "", 
"confidence": "" }, 
    "tiktok":     { "formula_used": "", "option_1": "", "option_2": "", "source_phrase": "", 
"confidence": "" }, 
    "instagram_reels": { "formula_used": "", "option_1": "", "option_2": "", "source_phrase": "", 
"confidence": "" }, 
    "newsletter_subject": { "formula_used": "", "option_1": "", "option_2": "", "preview_text": "" } 
  }, 
  "recommended_primary": "", 
  "reasoning": "" 
}`; 
 
  const raw  = await callModel([{ role: 'user', content: prompt }], MODELS.FAST, 1500, 0.5); 
  const data = parseJSON(raw); 
 
  ensureDir('intelligence/weekly'); 
  writeJSON('intelligence/weekly/hook-recommendation.json', { 
    generated: getTodayString(), 
    week:      getCurrentWeek(), 
    ...data, 
  }); 
 
  console.log('[hook-miner.js] Done. Hook recommendations written.'); 
} 
 
main();