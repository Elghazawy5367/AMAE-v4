// === FILE: agents/evolution-agent.js === 
// Job: Review discovered intelligence and file self-upgrade PRs for founder review 
// Reads: intelligence/discovered/*/intelligence.json 
// Writes: evolution PR branch + intelligence/absorbed/ or intelligence/discarded/ 
// Called by: .github/workflows/weekly-evolution.yml 
// 
// CRITICAL ZONE: Every PR filed here MUST be reviewed and merged by the founder. 
// This agent cannot decide what AMAE becomes. It can only propose. 
 
import fs from 'fs'; 
import path from 'path'; 
import { callModel, MODELS } from '../lib/openrouter.js'; 
import { readJSON, writeJSON, readText, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek }           from '../lib/week-utils.js'; 
 
async function findPendingIntelligence() { 
  const baseDir = path.join(process.cwd(), 'intelligence/discovered'); 
  if (!fs.existsSync(baseDir)) return []; 
 
  const slugs = fs.readdirSync(baseDir).filter(f => 
    fs.statSync(path.join(baseDir, f)).isDirectory() 
  ); 
 
  const pending = []; 
  for (const slug of slugs) { 
    const intel = readJSON(`intelligence/discovered/${slug}/intelligence.json`); 
    if (intel?.status === 'pending_evolution') { 
      pending.push({ slug, intel }); 
    } 
  } 
  return pending; 
} 
 
async function generateUpgradePatch(intel) { 
  const targetFile    = intel.current_amae_file; 
  const currentCode   = readText(targetFile); 
 
  if (!currentCode) { 
    return { success: false, reason: `Target file ${targetFile} not found in repo` }; 
  } 
 
  const prompt = `You are upgrading a specific file in an autonomous marketing system 
called AMAE. 
 
INTELLIGENCE SOURCE: ${intel.repo} 
CORE INSIGHT: ${intel.core_insight} 
INSIGHT TYPE: ${intel.insight_type} 
EVIDENCE IT WORKS: ${intel.evidence} 
REQUIRED UPGRADE: ${intel.upgrade_description} 
 
CURRENT FILE (${targetFile}): 
${currentCode.slice(0, 4000)} 
 
Your job: Write the minimal, precise upgrade to this file that absorbs the intelligence above. 
 
Rules: 
1. Only change what is necessary to absorb the insight 
2. Keep all existing functionality intact 
3. Add a comment above your change: // EVOLUTION [date]: [one line description] — 
source: [repo] 
4. Do not break any existing function signatures 
5. If the change is a prompt update: show the before and after prompt text clearly 
6. If the change is logic: show the specific function being updated 
 
Output format: 
===DESCRIPTION=== 
[One paragraph: what changes and why] 
 
===DIFF=== 
[Show the specific section that changes — before AND after, clearly labeled] 
 
===RISK ASSESSMENT=== 
[Low / Medium / High and why]`; 
 
  try { 
    const response = await callModel([{ role: 'user', content: prompt }], 
MODELS.REASONING, 2000, 0.3); 
    return { success: true, patch: response, targetFile }; 
  } catch (err) { 
    return { success: false, reason: err.message }; 
  } 
} 
 
async function main() { 
  console.log('[evolution-agent] Reviewing discovered intelligence for self-upgrade PRs...'); 
 
  const pending = await findPendingIntelligence(); 
  console.log(`[evolution-agent] ${pending.length} pending intelligence entries to review`); 
 
  if (pending.length === 0) { 
    console.log('[evolution-agent] Nothing to process. Run twin-agent first.'); 
    return; 
  } 
 
  const week       = getCurrentWeek(); 
  const prQueue    = []; 
  const discarded  = []; 
 
  for (const { slug, intel } of pending) { 
    console.log(`[evolution-agent] Evaluating: ${intel.repo} (${intel.confidence} confidence, 
${intel.risk} risk)`); 
 
    // Routing logic — what gets a PR vs what gets held 
    if (intel.confidence === 'low') { 
      discarded.push({ slug, intel, reason: 'Low confidence — insufficient evidence it works' }); 
      continue; 
    } 
 
    if (intel.risk === 'high') { 
      discarded.push({ slug, intel, reason: 'High risk architecture change — requires manual 
implementation' }); 
      continue; 
    } 
 
    if (intel.status === 'extraction_failed') { 
      discarded.push({ slug, intel, reason: 'Extraction failed during twin-agent step' }); 
      continue; 
    } 
 
    // Generate upgrade patch for medium/high confidence, low/medium risk 
    console.log(`[evolution-agent] Generating upgrade patch for: ${intel.repo}`); 
    const patch = await generateUpgradePatch(intel); 
 
    if (!patch.success) { 
      console.log(`[evolution-agent] Patch generation failed: ${patch.reason}`); 
      discarded.push({ slug, intel, reason: `Patch failed: ${patch.reason}` }); 
      continue; 
    } 
 
    prQueue.push({ slug, intel, patch }); 
    await new Promise(r => setTimeout(r, 1500)); 
  } 
 
  // Write PR descriptions for GitHub Actions to create 
  if (prQueue.length > 0) { 
    ensureDir('intelligence/evolution-queue'); 
 
    for (const { slug, intel, patch } of prQueue) { 
      const prData = { 
        branch_name:   `evolution/${week}-${intel.insight_type}-${slug.slice(0, 20)}`, 
        pr_title:      `Evolution ${week}: ${intel.insight_type.replace(/_/g, ' ')} — source: 
${intel.repo}`, 
        pr_body: [ 
          `## Evolution PR — ${week}`, 
          '', 
          `**Source repo:** [${intel.repo}](${intel.repo_url ?? `https://github.com/${intel.repo}`})`, 
          `**Stars:** ${intel.repo_stars ?? 'unknown'}`, 
          `**Confidence:** ${intel.confidence}`, 
          `**Risk level:** ${intel.risk} — ${intel.risk_reason}`, 
          '', 
          '### The Intelligence', 
          intel.core_insight, 
          '', 
          '### Evidence It Works', 
          intel.evidence, 
          '', 
          '### What Changes', 
          `**File:** \`${intel.current_amae_file}\``, 
          '', 
          patch.patch, 
          '', 
          '---', 
          '### Your Decision', 
          '- **Merge** → AMAE absorbs this intelligence', 
          '- **Close** → Discarded. Add a comment explaining why so AMAE learns what NOT 
to absorb.', 
          '', 
          '> This PR was filed automatically by evolution-agent.js', 
          '> AMAE cannot decide what it becomes. You merge or close.', 
        ].join('\n'), 
        target_file:   intel.current_amae_file, 
        patch_content: patch.patch, 
        intel_summary: intel.core_insight, 
      }; 
 
      writeJSON(`intelligence/evolution-queue/${slug}.json`, prData); 
      console.log(`[evolution-agent] PR queued: ${prData.pr_title}`); 
    } 
  } 
 
  // Update absorbed/discarded indexes 
  const absorbedIndex  = readJSON('intelligence/absorbed/index.json')  ?? { repos: [] }; 
  const discardedIndex = readJSON('intelligence/discarded/index.json') ?? { repos: [] }; 
 
  // Mark discarded entries 
  for (const { slug, intel, reason } of discarded) { 
    writeJSON(`intelligence/discarded/${slug}.json`, { ...intel, discarded_reason: reason, 
discarded_at: getTodayString() }); 
    if (!discardedIndex.repos.includes(intel.repo)) discardedIndex.repos.push(intel.repo); 
 
    // Update status 
    writeJSON(`intelligence/discovered/${slug}/intelligence.json`, { ...intel, status: 'discarded', 
discard_reason: reason }); 
  } 
 
  writeJSON('intelligence/discarded/index.json', discardedIndex); 
 
  console.log(`[evolution-agent] Done. ${prQueue.length} PRs queued, ${discarded.length} 
discarded.`); 
  if (prQueue.length > 0) { 
    console.log('[evolution-agent] PRs will be created by weekly-evolution.yml workflow.'); 
  } 
} 
 
main();