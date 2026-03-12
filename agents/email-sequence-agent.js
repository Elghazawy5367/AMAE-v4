// === FILE: agents/email-sequence-agent.js === 
// Job: Generate welcome/nurture/win-back email sequences 
// Reads: config/product-dna.json, intelligence/weekly/synthesis-brief.md 
// Writes: campaigns/[WEEK]/text/email-sequences/ 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { callModel, MODELS }            from '../lib/openrouter.js'; 
import { readJSON, readText, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getCurrentWeek }               from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[email-sequence-agent.js] Generating email sequences...'); 
 
  const week      = getCurrentWeek(); 
  const outputDir = `campaigns/${week}/text/email-sequences`; 
  ensureDir(outputDir); 
 
  const dna        = readJSON('config/product-dna.json'); 
  const product    = dna.products[dna.active_product]; 
  const synthBrief = readText('intelligence/weekly/synthesis-brief.md') ?? ''; 
  const emailSpec  = readText('.github/prompts/content-email-sequences.prompt.md') ?? ''; 
 
  const buildPrompt = (sequenceType) => emailSpec 
    .replace('[product.name]',                  product.name) 
    .replace('[product.tagline]',               product.tagline ?? '') 
    .replace('[desire.what_they_secretly_want]', 
product.the_desire?.what_they_secretly_want ?? '') 
    .replace('[desire.what_they_fear_most]',     product.the_desire?.what_they_fear_most ?? 
'') 
    .replace('[desire.who_they_want_to_become]', 
product.the_desire?.who_they_want_to_become ?? '') 
    .replace('[welcome | nurture | win-back — injected by email-sequence-agent.js]', 
sequenceType); 
 
  // Generate nurture email every week 
  console.log('[email-sequence-agent.js] Generating weekly nurture email...'); 
  const nurturePrompt   = buildPrompt('nurture'); 
  const nurtureResponse = await callModel([{ role: 'user', content: nurturePrompt }], 
MODELS.FAST, 1500, 0.7); 
  writeFile(`${outputDir}/nurture-week.md`, `# Nurture Email — 
${week}\n\n${nurtureResponse}`); 
 
  // Win-back email every week (for cold subscribers) 
  console.log('[email-sequence-agent.js] Generating win-back email...'); 
  const winbackPrompt   = buildPrompt('win-back'); 
  const winbackResponse = await callModel([{ role: 'user', content: winbackPrompt }], 
MODELS.FAST, 1000, 0.7); 
  writeFile(`${outputDir}/win-back.md`, `# Win-Back Email — 
${week}\n\n${winbackResponse}`); 
 
  // Welcome sequence only if this is a launch week 
  const isLaunchWeek = process.env.LAUNCH_MODE === 'true'; 
  if (isLaunchWeek) { 
    console.log('[email-sequence-agent.js] Launch mode: generating welcome sequence...'); 
    const welcomePrompt   = buildPrompt('welcome'); 
    const welcomeResponse = await callModel([{ role: 'user', content: welcomePrompt }], 
MODELS.REASONING, 3000, 0.7); 
    writeFile(`${outputDir}/welcome-sequence.md`, `# Welcome Sequence — 
${week}\n\n${welcomeResponse}`); 
  } 
 
  console.log('[email-sequence-agent.js] Done. Email sequences written.'); 
} 
 
main();