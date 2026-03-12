// === FILE: agents/content-mirror-agent.js === 
// Job: Quality gate — score every content piece, auto-rewrite if below 70 
// Reads: campaigns/[WEEK]/text/*.md, intelligence/weekly/copy-ammunition.md 
// Writes: campaigns/[WEEK]/guardrail-log.md (appends), rewrites files if needed 
// Called by: .github/workflows/weekly-campaign.yml (after guardrail-agent.js) 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, readText, writeFile, listFiles } from '../lib/file-utils.js'; 
import { getCurrentWeek } from '../lib/week-utils.js'; 
import path from 'path'; 
 
const MIRROR_PROMPT = (content, platform, funnelStage, verbatimHook) => ` 
You are scoring marketing content against quality benchmarks. 
 
Platform: ${platform} 
Funnel stage: ${funnelStage} 
Target verbatim hook: "${verbatimHook}" 
 
CONTENT TO SCORE: 
${content.slice(0, 3000)} 
 
Score each dimension 0-100. Be specific about failures. Return ONLY valid JSON: 
{ 
  "platform": "${platform}", 
  "scores": { 
    "hook_strength": 0, 
    "voice_authenticity": 0, 
    "audience_vocabulary": 0, 
    "platform_mechanics": 0, 
    "funnel_clarity": 0 
  }, 
  "weighted_score": 0, 
  "pass": false, 
  "failures": [ 
    { "dimension": "name", "score": 0, "specific_issue": "what exactly", "fix_instruction": "how 
to fix" } 
  ], 
  "rewrite_required": false, 
  "rewrite_instructions": null 
}`; 
 
async function scoreContent(content, platform, funnelStage, verbatimHook) { 
  const prompt = MIRROR_PROMPT(content, platform, funnelStage, verbatimHook); 
  const raw    = await callModel([{ role: 'user', content: prompt }], MODELS.CLASSIFIER, 
1000, 0.1); 
  return parseJSON(raw); 
} 
 
async function rewriteContent(content, failures) { 
  const fixInstructions = failures.map(f => `${f.dimension}: ${f.fix_instruction}`).join('\n'); 
  const prompt = `Fix ONLY these specific issues in the content below. Do not change 
anything else. 
 
ISSUES TO FIX: 
${fixInstructions} 
 
CONTENT: 
${content.slice(0, 3000)} 
 
Output ONLY the corrected content. No preamble.`; 
 
  return callModel([{ role: 'user', content: prompt }], MODELS.FAST, 2000, 0.5); 
} 
 
async function main() { 
  console.log('[content-mirror-agent.js] Running content quality gate...'); 
 
  const week          = getCurrentWeek(); 
  const textDir       = `campaigns/${week}/text`; 
  const copyAmmo      = readText('intelligence/weekly/copy-ammunition.md') ?? ''; 
  const hookMatch     = copyAmmo.match(/^"(.+)"$/m); 
  const verbatimHook  = hookMatch?.[1] ?? ''; 
  const funnelMap     = readJSON(`campaigns/${week}/funnel-map.json`) ?? { 
classified_pieces: [] }; 
 
  const contentFiles = listFiles(textDir, '.md'); 
  if (!contentFiles.length) { 
    console.log('[content-mirror-agent.js] No content files found. Skipping.'); 
    return; 
  } 
 
  const logLines = [`# Content Mirror Log — ${week}\n`]; 
  let totalPassed = 0, totalFailed = 0; 
 
  for (const filePath of contentFiles) { 
    const platform  = path.basename(filePath, '.md').split('-')[0]; 
    const funnelTag = funnelMap.classified_pieces?.find(p => 
p.file?.includes(path.basename(filePath)))?.stage ?? 'TOFU'; 
    const content   = readText(filePath) ?? ''; 
 
    if (content.length < 100) continue; 
 
    try { 
      const score = await scoreContent(content, platform, funnelTag, verbatimHook); 
 
      if (!score?.weighted_score) continue; 
 
      logLines.push(`## ${path.basename(filePath)}`); 
      logLines.push(`Score: ${score.weighted_score}/100 — ${score.pass ? '✅ PASS' : '❌ 
FAIL'}`); 
 
      if (!score.pass && score.rewrite_required && score.failures?.length) { 
        logLines.push(`Rewriting (failures: ${score.failures.map(f => f.dimension).join(', ')})...`); 
 
        const rewritten = await rewriteContent(content, score.failures); 
        writeFile(filePath, rewritten); 
        logLines.push('Rewrite complete.'); 
        totalFailed++; 
      } else { 
        totalPassed++; 
      } 
 
      if (score.failures?.length > 0 && !score.rewrite_required) { 
        logLines.push(`Warnings: ${score.failures.map(f => f.specific_issue).join('; ')}`); 
      } 
 
    } catch (err) { 
      console.error(`[content-mirror-agent.js] Error scoring ${filePath}:`, err.message); 
      logLines.push(`## ${path.basename(filePath)}\nERROR: ${err.message}`); 
    } 
 
    await new Promise(r => setTimeout(r, 800)); 
  } 
 
  logLines.push(`\n**Summary:** ${totalPassed} passed, ${totalFailed} rewritten`); 
  writeFile(`campaigns/${week}/content-mirror-log.md`, logLines.join('\n')); 
  console.log(`[content-mirror-agent.js] Done. ${totalPassed} passed, ${totalFailed} 
rewritten.`); 
} 
 
main();