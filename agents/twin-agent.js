// === FILE: agents/twin-agent.js === 
// Job: Read top repos from scout-report and extract the single most valuable marketing 
insight from each 
// Reads: intelligence/scout-report.json 
// Writes: intelligence/discovered/[repo-slug]/intelligence.json 
// Called by: .github/workflows/weekly-evolution.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { readJSON, writeJSON, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString }                from '../lib/week-utils.js'; 
 
const GITHUB_RAW = 'https://raw.githubusercontent.com'; 
const GITHUB_API = 'https://api.github.com'; 
 
async function githubFetch(url) { 
  const token   = process.env.GITHUB_TOKEN; 
  const headers = { 'User-Agent': 'AMAE-Twin/1.0' }; 
  if (token) headers['Authorization'] = `Bearer ${token}`; 
 
  try { 
    const response = await fetch(url, { headers }); 
    if (!response.ok) return null; 
    return response.text(); 
  } catch { 
    return null; 
  } 
} 
 
async function fetchRepoContent(fullName) { 
  const contents = []; 
 
  // Files to try fetching, in priority order 
  const targets = [ 
    `${GITHUB_RAW}/${fullName}/main/README.md`, 
    `${GITHUB_RAW}/${fullName}/master/README.md`, 
    `${GITHUB_RAW}/${fullName}/main/PROMPTS.md`, 
    `${GITHUB_RAW}/${fullName}/main/hooks.md`, 
    `${GITHUB_RAW}/${fullName}/main/PLAYBOOK.md`, 
    `${GITHUB_RAW}/${fullName}/main/results/README.md`, 
  ]; 
 
  for (const url of targets) { 
    const content = await githubFetch(url); 
    if (content && content.length > 100) { 
      const filename = url.split('/').pop(); 
      contents.push(`=== ${filename} ===\n${content.slice(0, 3000)}`); 
    } 
    await new Promise(r => setTimeout(r, 300)); // Polite rate limiting 
  } 
 
  // Try to list prompts/ directory 
  const promptsUrl  = `${GITHUB_API}/repos/${fullName}/contents/.github/prompts`; 
  const promptsDir  = await githubFetch(promptsUrl); 
  if (promptsDir) { 
    try { 
      const files = JSON.parse(promptsDir); 
      for (const file of files.slice(0, 3)) { 
        const content = await githubFetch(file.download_url); 
        if (content) contents.push(`=== ${file.name} ===\n${content.slice(0, 1500)}`); 
        await new Promise(r => setTimeout(r, 300)); 
      } 
    } catch {} 
  } 
 
  return contents.join('\n\n---\n\n'); 
} 
 
async function main() { 
  console.log('[twin-agent] Extracting intelligence from scout candidates...'); 
 
  const scoutReport = readJSON('intelligence/scout-report.json'); 
 
  if (!scoutReport?.top_candidates?.length) { 
    console.log('[twin-agent] No scout report or no candidates. Run scout-agent first.'); 
    return; 
  } 
 
  const candidates = scoutReport.top_candidates.slice(0, 3); // Max 3 per week 
  console.log(`[twin-agent] Processing ${candidates.length} repos...`); 
 
  for (const candidate of candidates) { 
    const slug = candidate.full_name.replace('/', '--'); 
    console.log(`[twin-agent] Reading: ${candidate.full_name}`); 
 
    const content = await fetchRepoContent(candidate.full_name); 
 
    if (!content || content.length < 200) { 
      console.log(`[twin-agent] ${candidate.full_name}: insufficient content — skipping`); 
      continue; 
    } 
 
    const prompt = `You are extracting marketing intelligence from a GitHub repository for an 
autonomous marketing system. 
 
REPO: ${candidate.full_name} 
DESCRIPTION: ${candidate.description} 
SIGNAL SCORE: ${candidate.signal_score} 
HIGH-VALUE FILES FOUND: ${candidate.high_value_files?.join(', ') ?? 'none'} 
 
REPO CONTENT: 
${content.slice(0, 6000)} 
 
Your job: Extract exactly ONE core insight that would improve an autonomous marketing 
engine. 
Choose the insight with the highest evidence — something that has been tested and has 
results, not just a theory. 
 
Output ONLY a valid JSON object with these exact fields: 
 
{ 
  "core_insight": "one sentence — the specific thing that was learned", 
  "insight_type": "hook_formula | prompt_architecture | platform_mechanic | 
content_framework | workflow_pattern | ab_test_result | distribution_tactic", 
  "evidence": "what specific thing in the repo proves this actually works", 
  "current_amae_file": "which AMAE file would this upgrade (e.g. agents/content-factory.js)", 
  "upgrade_description": "in one paragraph: how AMAE would improve if it absorbed this 
insight", 
  "confidence": "high | medium | low", 
  "risk": "low | medium | high", 
  "risk_reason": "why it is this risk level (low=prompt change, medium=logic change, 
high=architecture change)" 
}`; 
 
    try { 
      const response  = await callModel([{ role: 'user', content: prompt }], 
MODELS.REASONING, 1000, 0.3); 
      const intel     = parseJSON(response); 
 
      // Validate required fields 
      const required = ['core_insight', 'insight_type', 'evidence', 'current_amae_file', 
'upgrade_description', 'confidence', 'risk']; 
      const missing  = required.filter(k => !intel[k]); 
      if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(', ')}`); 
 
      const outputPath = `intelligence/discovered/${slug}`; 
      ensureDir(outputPath); 
 
      writeJSON(`${outputPath}/intelligence.json`, { 
        ...intel, 
        repo:             candidate.full_name, 
        repo_url:         candidate.url, 
        repo_stars:       candidate.stars, 
        extracted_at:     getTodayString(), 
        processed_by:     'twin-agent', 
        status:           'pending_evolution', 
      }); 
 
      console.log(`[twin-agent] ${candidate.full_name}: ${intel.confidence} confidence 
${intel.insight_type}`); 
 
    } catch (err) { 
      console.error(`[twin-agent] Failed to extract from ${candidate.full_name}:`, err.message); 
 
      const outputPath = `intelligence/discovered/${slug}`; 
      ensureDir(outputPath); 
      writeJSON(`${outputPath}/intelligence.json`, { 
        repo:          candidate.full_name, 
        status:        'extraction_failed', 
        error:         err.message, 
        extracted_at:  getTodayString(), 
      }); 
    } 
 
    await new Promise(r => setTimeout(r, 2000)); // Pause between repos 
  } 
 
  console.log('[twin-agent] Done. Run evolution-agent to process discovered intelligence.'); 
} 
 
main();