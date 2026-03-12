// === FILE: agents/competitor-autopsist.js === 
// Job: Analyze competitor GitHub Issues + review data → extract copy ammunition 
// Reads: config/intelligence-config.json, config/product-dna.json 
// Writes: intelligence/weekly/competitor-failures.md 
// Called by: .github/workflows/weekly-intelligence.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getRepoIssues }                 from '../lib/github-api.js'; 
import { getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function fetchCompetitorIssues(competitors) { 
  const allIssues = []; 
 
  for (const competitor of competitors) { 
    if (!competitor.their_repo) continue; 
 
    const repoPath = competitor.their_repo.replace('github.com/', ''); 
    console.log(`[competitor-autopsist.js] Mining issues: ${repoPath}`); 
 
    try { 
      const issues = await getRepoIssues(repoPath, 'open', 50); 
      const closed = await getRepoIssues(repoPath, 'closed', 50); 
 
      const relevant = [...issues, ...closed].filter(issue => { 
        const text = (issue.title + ' ' + (issue.body ?? '')).toLowerCase(); 
        return ['bug', 'broken', 'can\'t', 'cannot', 'missing', 'wish', 'please add', 
          'slow', 'crash', 'error', 'doesn\'t work', 'not working', 'support', 
          'pricing', 'expensive', 'too complex', 'documentation', 'confusing'].some(kw => 
text.includes(kw)); 
      }); 
 
      allIssues.push({ 
        competitor:     competitor.name, 
        their_weakness: competitor.their_weakness, 
        your_advantage: competitor.your_advantage, 
        issues: relevant.slice(0, 20).map(i => ({ 
          title:   i.title, 
          body:    (i.body ?? '').slice(0, 500), 
          labels:  i.labels?.map(l => l.name) ?? [], 
          upvotes: i.reactions?.['+1'] ?? 0, 
          comments: i.comments ?? 0, 
        })), 
      }); 
    } catch (err) { 
      console.error(`[competitor-autopsist.js] Failed: ${competitor.name}:`, err.message); 
    } 
 
    await new Promise(r => setTimeout(r, 1500)); 
  } 
 
  return allIssues; 
} 
 
async function main() { 
  console.log('[competitor-autopsist.js] Starting competitor failure analysis...'); 
 
  const config  = readJSON('config/intelligence-config.json'); 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna.products[dna.active_product]; 
 
  if (!product?.competitors?.length) { 
    console.log('[competitor-autopsist.js] No competitors configured in product-dna.json. 
Skipping.'); 
    ensureDir('intelligence/weekly'); 
    writeFile('intelligence/weekly/competitor-failures.md', 
      `# Competitor Failure Intelligence — ${getCurrentWeek()}\n\n_No competitors 
configured. Add competitor repos to config/product-dna.json._\n`); 
    return; 
  } 
 
  const issueData = await fetchCompetitorIssues(product.competitors); 
 
  const prompt = `You are extracting competitor failure intelligence for a marketing system. 
 
PRODUCT: ${product.name} 
OUR UNIQUE ANGLE: ${product.solution?.unique_angle ?? ''} 
WHAT WE ARE NOT: ${product.solution?.what_you_are_not ?? ''} 
 
COMPETITOR FAILURE DATA: 
${JSON.stringify(issueData, null, 2)} 
 
TASK: For each competitor, identify the top 3 failure patterns with the most evidence. 
Extract the most emotionally resonant complaint language as verbatim copy ammunition. 
Map each failure to a positioning angle for ${product.name}. 
 
${config?.analysis_prompt ?? ''} 
 
Return ONLY valid JSON: 
{ 
  "competitor_failures": [ 
    { 
      "competitor": "name", 
      "failure_category": "category", 
      "evidence_count": 0, 
      "verbatim_complaint": "exact complaint", 
      "your_copy_angle": "positioning statement", 
      "content_use_cases": ["landing page", "objection handling"] 
    } 
  ], 
  "objection_preemption_map": [ 
    { 
      "objection": "We already use X", 
      "response_angle": "specific response", 
      "content_type": "BOFU" 
    } 
  ], 
  "copy_ready_sentences": [ 
    { "use": "comparison headline", "sentence": "ready to use" } 
  ] 
}`; 
 
  console.log('[competitor-autopsist.js] Synthesizing with AI...'); 
  const raw  = await callModel([{ role: 'user', content: prompt }], MODELS.REASONING, 
2000, 0.3); 
  const data = parseJSON(raw); 
 
  const markdown = `# Competitor Failure Intelligence — ${getCurrentWeek()} 
Generated: ${getTodayString()} 
 
## COPY AMMUNITION 
 
${data.competitor_failures?.map(f => `### ${f.competitor}: "${f.verbatim_complaint}" 
- Evidence count: ${f.evidence_count} 
- Failure type: ${f.failure_category} 
- Your copy angle: ${f.your_copy_angle} 
- Use in: ${f.content_use_cases?.join(', ')}`).join('\n\n') ?? '_No data_'} 
 
## OBJECTION PRE-EMPTION MAP 
 
${data.objection_preemption_map?.map(o => `**When they say:** "${o.objection}" 
**Your angle:** ${o.response_angle} 
**Content type:** ${o.content_type}`).join('\n\n') ?? '_No objections mapped_'} 
 
## COPY-READY SENTENCES 
 
${data.copy_ready_sentences?.map(s => `**${s.use}:** "${s.sentence}"`).join('\n') ?? ''} 
`; 
 
  ensureDir('intelligence/weekly'); 
  writeFile('intelligence/weekly/competitor-failures.md', markdown); 
  console.log('[competitor-autopsist.js] Done. Competitor failures written.'); 
} 
 
main();