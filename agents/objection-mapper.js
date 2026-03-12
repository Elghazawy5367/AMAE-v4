// === FILE: agents/objection-mapper.js === 
// Job: Map objections from competitor failure data, generate pre-emption content 
// Reads: intelligence/weekly/competitor-failures.md, config/product-dna.json 
// Writes: intelligence/weekly/objection-map.md 
// Called by: .github/workflows/weekly-intelligence.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, readText, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[objection-mapper.js] Mapping objections...'); 
 
  const dna             = readJSON('config/product-dna.json'); 
  const product         = dna.products[dna.active_product]; 
  const competitorFails = readText('intelligence/weekly/competitor-failures.md') ?? ''; 
 
  const prompt = `You are mapping objections a skeptical prospect would have about 
${product.name}. 
 
PRODUCT: ${product.name} 
STAGE: ${product.stage ?? 'launched'} 
UNIQUE ANGLE: ${product.solution?.unique_angle ?? ''} 
WHAT WE ARE NOT: ${product.solution?.what_you_are_not ?? ''} 
ICP SOPHISTICATION: ${product.icp?.sophistication_level ?? 'intermediate'} 
PRICING: ${JSON.stringify(product.pricing ?? {})} 
 
COMPETITOR FAILURE DATA (informs what prospects fear): 
${competitorFails.slice(0, 2000)} 
 
Map the top 5 objections with pre-emption content for each. 
 
Return ONLY valid JSON: 
{ 
  "objection_map": [ 
    { 
      "objection": "exact wording", 
      "category": "category|trust|complexity|value|timing", 
      "frequency": "high|medium|low", 
      "pre_emption_angle": "how to address proactively", 
      "content_ready_sentence": "one sentence for content", 
      "best_content_type": "BOFU comparison|MOFU case study|TOFU story", 
      "platform_fit": ["linkedin", "email", "quora"] 
    } 
  ], 
  "primary_objection_this_week": "single most important to address", 
  "objection_library_additions": [] 
}`; 
 
  const raw  = await callModel([{ role: 'user', content: prompt }], MODELS.REASONING, 
1500, 0.3); 
  const data = parseJSON(raw); 
 
  const markdown = `# Objection Pre-emption Map — ${getCurrentWeek()} 
Generated: ${getTodayString()} 
 
## PRIMARY OBJECTION THIS WEEK 
${data.primary_objection_this_week ?? '_None identified_'} 
 
## FULL OBJECTION MAP 
 
${data.objection_map?.map(o => `### "${o.objection}" 
- Category: ${o.category} 
- Frequency: ${o.frequency} 
- Pre-emption angle: ${o.pre_emption_angle} 
- Ready sentence: "${o.content_ready_sentence}" 
- Best content type: ${o.best_content_type} 
- Platforms: ${o.platform_fit?.join(', ')}`).join('\n\n') ?? '_No objections mapped_'} 
`; 
 
  ensureDir('intelligence/weekly'); 
  writeFile('intelligence/weekly/objection-map.md', markdown); 
  console.log('[objection-mapper.js] Done. Objection map written.'); 
} 
 
main();