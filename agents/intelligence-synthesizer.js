// === FILE: agents/intelligence-synthesizer.js === 
// PHASE 2 FIX 2 APPLIED: reads all 6 intel files (copy-ammunition, timing-windows, 
// competitor-failures, audience-map, hook-recommendation, objection-map) 
// Job: Synthesize all intelligence files into one weekly brief for the Campaign Engine 
// Reads: copy-ammunition.md, timing-windows.json, product-dna.json, memory/insights.json 
// Writes: intelligence/weekly/synthesis-brief.md 
// Called by: .github/workflows/weekly-intelligence.yml (final Tuesday step) 
 
import { callModel, MODELS } from '../lib/openrouter.js'; 
import { readJSON, readText, writeText } from '../lib/file-utils.js'; 
import { getIntelFolder, getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[intelligence-synthesizer] Starting synthesis...'); 
 
  const intelDir = getIntelFolder(); 
  const dna      = readJSON('config/product-dna.json'); 
  const insights = readJSON('memory/insights.json') ?? {}; 
  const copyAmmo = readText(`${intelDir}/copy-ammunition.md`); 
  const timing   = readJSON(`${intelDir}/timing-windows.json`) ?? {}; 
  // GAP-FIX: Read all 6 intel files (was only reading 2)
  const competitorFails = readText(`${intelDir}/competitor-failures.md`) ?? '';
  const audienceMap     = readJSON(`${intelDir}/audience-map.json`) ?? {};
  const hookRec         = readJSON(`${intelDir}/hook-recommendation.json`) ?? {};
  const objectionMap    = readText(`${intelDir}/objection-map.md`) ?? '';

 
  if (!dna) { 
    console.error('[intelligence-synthesizer] product-dna.json missing — aborting'); 
    process.exit(1); 
  } 
 
  const product = dna.products[dna.active_product]; 
  const desire  = product.the_desire; 
  const voice   = dna.brand_voice; 
 
  // Handle first run with no copy ammunition yet 
  const copySection = copyAmmo 
    ? copyAmmo.slice(0, 4000) 
    : `No copy ammunition available yet. Use the_desire section from product-dna.json as the 
source of copy language.`; 
 
  
  const competitorSection = competitorFails.slice(0, 800) || 'No competitor data this week.';
  const audienceSection   = Object.keys(audienceMap).length
    ? JSON.stringify(audienceMap).slice(0, 500)
    : 'No audience location data this week.';
  const hookSection       = Object.keys(hookRec).length
    ? JSON.stringify(hookRec).slice(0, 500)
    : 'No hook recommendations this week.';
  const objectionSection  = objectionMap.slice(0, 600) || 'No objection data this week.';

const timingSection = timing.publish_now?.length 
    ? `PUBLISH NOW: ${timing.publish_now.map(t => `"${t.topic}"`).join(' | ')}\nPREPARE 
NEXT WEEK: ${timing.prepare_next_week?.map(t => `"${t.topic}"`).join(' | ') ?? 'none'}` 
    : 'No timing windows identified this week.'; 
 
  const memorySection = insights.recommendation 
    ?? 'No performance data yet. Default to TOFU awareness content on primary platform.'; 
 
  const prompt = `You are the intelligence synthesizer for an autonomous marketing system 
called AMAE. 
 
Your job: read this week's intelligence data and write a precise campaign brief. 
Every claim must trace to the data provided. Never invent intelligence. 
 
===PRODUCT=== 
Name: ${product.name} 
Tagline: ${product.tagline} 
What they secretly want: ${desire.what_they_secretly_want} 
What they fear most: ${desire.what_they_fear_most} 
What they are frustrated by: ${desire.what_they_are_frustrated_by} 
Who they want to become: ${desire.who_they_want_to_become} 
 
===THIS WEEK'S COPY AMMUNITION (real words from real people)=== 
${copySection} 
 
===TIMING WINDOWS=== 
${timingSection} 
 
 
===COMPETITOR INTELLIGENCE (what is failing for competitors this week)=== 
${competitorSection} 
 
===AUDIENCE LOCATION (where ICP is spending time this week)=== 
${audienceSection} 
 
===HOOK RECOMMENDATIONS (best hook formulas for this angle)=== 
${hookSection} 
 
===OBJECTION MAP (pre-empt these this week)=== 
${objectionSection} 
===MEMORY (what has worked before)=== 
${memorySection} 
 
===VOICE RULES=== 
Tone: ${voice?.tone ?? 'direct'} 
Never say: ${(voice?.never_say ?? []).join(', ')} 
 
===YOUR OUTPUT: Answer each section exactly=== 
 
**1. DOMINANT THEME THIS WEEK** (1 sentence) 
What single underlying desire or fear is showing up most in the copy ammunition this week? 
Do not name a topic — name the human emotion driving it. 
Cite which source confirms it. 
 
**2. PSYCHOLOGICAL LEVER** (1 word + 1 sentence why) 
Choose exactly one: Loss Aversion | Social Proof | Authority | FOMO | Identity | Reciprocity 
Why this lever this week: what in the data makes this the right choice? 
 
**3. VERBATIM HOOK** (1 sentence — must come from copy ammunition) 
The exact first sentence for this week's hero piece. 
RULE: Must be taken or directly adapted from a Tier 1 quote above. Cannot be invented. 
If no Tier 1 quotes exist: use the most emotionally resonant phrase from the_desire section. 
 
**4. HERO PLATFORM** (1 platform + 1 reason) 
Which single platform has the highest leverage this week? 
Based on: timing windows + performance memory. One platform only. 
 
**5. OBJECTION TO PREEMPT** (1 sentence) 
What will the skeptical prospect say before dismissing this? 
We address this proactively in every piece this week. 
 
**6. THREE COPY-READY SENTENCES** 
Each must sound like a real human, not a marketer. 
[HOOK]:    The opening line 
[EMPATHY]: The line that shows you understand their exact situation 
[CTA]:     The closing action — specific, not generic 
 
**7. FUNNEL PRIORITY** (TOFU / MOFU / BOFU + 1 sentence why) 
Which stage needs the most content this week? 
If no performance data: TOFU. 
 
Write the brief now. Be specific. Under 500 words total.`; 
 
  console.log('[intelligence-synthesizer] Calling AI for synthesis (deepseek-r1)...'); 
  const brief = await callModel( 
    [{ role: 'user', content: prompt }], 
    MODELS.REASONING, 
    2000, 
    0.5 // Lower temperature for more precise synthesis 
  ); 
 
  const week   = getCurrentWeek(); 
  const output = [ 
    `# Synthesis Brief — ${week}`, 
    `_Generated: ${getTodayString()}_`, 
    `_Source: Reddit mining + HN timing + memory_`, 
    '', 
    brief, 
    '', 
    '---', 
    '', 
    '## Raw Timing Data', 
    `Publish now: ${timing.publish_now?.map(t => t.topic).join(' · ') || 'none'}`, 
    `Prepare next week: ${timing.prepare_next_week?.map(t => t.topic).join(' · ') || 'none'}`, 
  ].join('\n'); 
 
  writeText(`${intelDir}/synthesis-brief.md`, output); 
  console.log('[intelligence-synthesizer] Done. synthesis-brief.md written.'); 
} 
 
main();