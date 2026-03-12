// === FILE: agents/launch-protocol-agent.js === 
// Job: Generate complete launch sequence content (pre-launch + launch day + 
follow-through) 
// Reads: config/product-dna.json, RELEASE_NAME/RELEASE_BODY env vars or Issue 
brief 
// Writes: campaigns/launch/ (all launch content) 
// Called by: .github/workflows/launch-protocol.yml 
 
import { callModel, MODELS }                    from '../lib/openrouter.js'; 
import { readJSON, readText, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString }                         from '../lib/week-utils.js'; 
 
const LAUNCH_PHASES = ['pre-launch', 'launch-day', 'follow-through']; 
 
async function generateLaunchContent(product, phase, releaseInfo) { 
  const prompt = `You are generating ${phase} launch content for a product launch. 
 
PRODUCT: ${product.name} 
TAGLINE: ${product.tagline} 
PROOF POINT: ${product.solution?.proof_point ?? ''} 
ICP: ${product.icp?.primary ?? ''} 
FOUNDER VOICE: ${product.brand_voice?.sounds_like ?? ''} 
 
LAUNCH DETAILS: 
${releaseInfo} 
 
PHASE: ${phase} 
 
Generate all ${phase} content. Be specific, human, story-driven. 
Every piece should feel like it was written by the actual founder — not a marketing team. 
 
For pre-launch: teaser posts + early-access email 
For launch-day: PH first comment + LinkedIn announcement + Twitter thread + Show HN + 
Reddit post + Newsletter 
For follow-through: day-1 stats post + user story post + launch retrospective 
 
Output clearly labeled sections for each content piece. 
Output ONLY the content. No preamble.`; 
 
  return callModel([{ role: 'user', content: prompt }], MODELS.REASONING, 4000, 0.7); 
} 
 
async function main() { 
  console.log('[launch-protocol-agent.js] Generating launch sequence...'); 
 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna?.products?.[dna?.active_product]; 
 
  if (!product) { 
    console.error('[launch-protocol-agent.js] No product config found.'); 
    process.exit(1); 
  } 
 
  const releaseInfo = [ 
    process.env.RELEASE_NAME ? `Release: ${process.env.RELEASE_NAME}` : '', 
    process.env.RELEASE_BODY ? `Notes: ${process.env.RELEASE_BODY}` : '', 
  ].filter(Boolean).join('\n') || 'Standard product launch'; 
 
  const launchDir = 'campaigns/launch'; 
  ensureDir(`${launchDir}/text`); 
 
  for (const phase of LAUNCH_PHASES) { 
    console.log(`[launch-protocol-agent.js] Generating ${phase}...`); 
    const content = await generateLaunchContent(product, phase, releaseInfo); 
    writeFile(`${launchDir}/text/${phase}.md`, `# Launch ${phase} — 
${getTodayString()}\n\n${content}`); 
  } 
 
  // Generate posting schedule 
  const schedule = `# Launch Posting Schedule 
Generated: ${getTodayString()} 
 
## T-72 hours (3 days before) 
- [ ] Post teaser in 3 Reddit communities (MANUAL) 
- [ ] Send early-access email to newsletter list (MANUAL) 
- [ ] Discord/community soft announcement (MANUAL) 
 
## Launch Day 
- [ ] 12:01am PT — Product Hunt listing goes live (MANUAL) 
- [ ] 8:00am ET  — LinkedIn founder announcement (auto on merge) 
- [ ] 9:00am ET  — Twitter/X launch thread (auto on merge) 
- [ ] 10:00am ET — Show HN post (MANUAL) 
- [ ] 12:00pm ET — Reddit posts (MANUAL) 
- [ ] 2:00pm ET  — TikTok/Reels launch video (MANUAL RECORD) 
- [ ] 5:00pm ET  — GitHub Release published (MANUAL) 
- [ ] 8:00pm ET  — Newsletter to full list (MANUAL SEND) 
 
## T+1 to T+7 
- [ ] Respond to EVERY PH comment (AMAE drafts, you send) 
- [ ] Day 1 stats post (auto-generate when you add stats) 
- [ ] Day 7 retrospective (auto-generate) 
 
**Always check: Reddit and Quora = human posts only. Newsletter = human send only.** 
`; 
  writeFile(`${launchDir}/LAUNCH-SCHEDULE.md`, schedule); 
  console.log('[launch-protocol-agent.js] Launch sequence complete. Review 
campaigns/launch/.'); 
} 
 
main();