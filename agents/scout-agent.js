// === FILE: agents/scout-agent.js === 
// Job: Scan GitHub weekly for elite marketing repos worth absorbing into AMAE 
// Reads: config/intelligence-config.json, intelligence/absorbed/, intelligence/discarded/ 
// Writes: intelligence/scout-report.json 
// Called by: .github/workflows/weekly-evolution.yml 
 
import { readJSON, writeJSON, fileExists } from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek }  from '../lib/week-utils.js'; 
 
const GITHUB_SEARCH = 'https://api.github.com/search/repositories'; 
 
// Topics with confirmed high signal-to-noise for marketing intelligence 
const WATCHED_TOPICS = [ 
  'marketing-automation', 'growth-hacking', 'content-marketing', 
  'ai-marketing', 'prompt-engineering', 'llm-prompts', 'ai-agents', 
  'aeo-optimization', 'indie-hacker', 'solo-founder', 'build-in-public', 
  'saas-marketing', 'ai-copywriting', 'content-automation', 
  'social-media-automation', 'autonomous-agents', 
]; 
 
// Files that signal a repo contains extractable marketing intelligence 
const HIGH_VALUE_FILES = [ 
  'prompts/', 'PROMPTS.md', 'hooks.md', 'frameworks/', 'results/', 
  'case-studies/', 'agents/', 'experiments/', '.github/prompts/', 
  'playbooks/', 'workflows/', 'PLAYBOOK.md', 
]; 
 
// Commit message patterns that indicate real measured learning 
const VALUABLE_COMMIT_PATTERNS = [ 
  'improved engagement', 'a/b test', 'viral hook', 'algorithm update', 
  'prompt optimization', '10x', 'new platform', 'results:', 'increased by', 
]; 
 
async function githubFetch(url) { 
  const token = process.env.GITHUB_TOKEN; 
  const headers = { 
    'Accept':     'application/vnd.github.v3+json', 
    'User-Agent': 'AMAE-Scout/1.0', 
  }; 
  if (token) headers['Authorization'] = `Bearer ${token}`; 
 
  const response = await fetch(url, { headers }); 
 
  if (response.status === 403) { 
    const remaining = response.headers.get('x-ratelimit-remaining'); 
    console.log(`[scout-agent] GitHub rate limit — remaining: ${remaining}`); 
    if (remaining === '0') { 
      const reset = response.headers.get('x-ratelimit-reset'); 
      console.log(`[scout-agent] Rate limit resets at: ${new Date(Number(reset) * 
1000).toISOString()}`); 
    } 
    return null; 
  } 
  if (!response.ok) return null; 
  return response.json(); 
} 
 
async function getRepoStarVelocity(fullName) { 
  // Check recent stargazers to estimate velocity 
  const url  = `https://api.github.com/repos/${fullName}/stargazers?per_page=30&page=1`; 
  const data = await githubFetch(url); 
  if (!data || !Array.isArray(data)) return 0; 
 
  // Count stars received in the last 7 days 
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; 
  return data.filter(s => s.starred_at && new Date(s.starred_at).getTime() > 
oneWeekAgo).length; 
} 
 
async function checkHighValueFiles(fullName) { 
  const url  = `https://api.github.com/repos/${fullName}/contents`; 
  const data = await githubFetch(url); 
  if (!data || !Array.isArray(data)) return []; 
 
  const found = []; 
  const names = data.map(f => f.name.toLowerCase()); 
 
  for (const hvf of HIGH_VALUE_FILES) { 
    const cleanHvf = hvf.replace('/', '').toLowerCase(); 
    if (names.some(n => n.includes(cleanHvf))) found.push(hvf); 
  } 
  return found; 
} 
 
async function getRecentCommitSignals(fullName) { 
  const url  = `https://api.github.com/repos/${fullName}/commits?per_page=20`; 
  const data = await githubFetch(url); 
  if (!data || !Array.isArray(data)) return []; 
 
  const signals = []; 
  for (const commit of data) { 
    const msg = (commit.commit?.message ?? '').toLowerCase(); 
    for (const pattern of VALUABLE_COMMIT_PATTERNS) { 
      if (msg.includes(pattern)) { 
        signals.push(pattern); 
        break; 
      } 
    } 
  } 
  return [...new Set(signals)]; // Unique signals 
} 
 
async function main() { 
  console.log('[scout-agent] Starting GitHub intelligence scout...'); 
 
  const alreadyAbsorbed  = new Set(); 
  const alreadyDiscarded = new Set(); 
 
  // Load existing absorbed/discarded to avoid re-processing 
  const absorbed  = readJSON('intelligence/absorbed/index.json')  ?? { repos: [] }; 
  const discarded = readJSON('intelligence/discarded/index.json') ?? { repos: [] }; 
  absorbed.repos.forEach(r  => alreadyAbsorbed.add(r)); 
  discarded.repos.forEach(r => alreadyDiscarded.add(r)); 
 
  const candidates = []; 
  const seenRepos  = new Set(); 
 
  for (const topic of WATCHED_TOPICS) { 
    console.log(`[scout-agent] Scanning topic: ${topic}`); 
 
    const url  = 
`${GITHUB_SEARCH}?q=topic:${topic}&sort=updated&order=desc&per_page=20`; 
    const data = await githubFetch(url); 
    if (!data?.items) continue; 
 
    for (const repo of data.items) { 
      if (seenRepos.has(repo.full_name)) continue; 
      if (alreadyAbsorbed.has(repo.full_name)) continue; 
      if (alreadyDiscarded.has(repo.full_name)) continue; 
 
      seenRepos.add(repo.full_name); 
 
      // Quick filters 
      if (repo.stargazers_count < 50) continue; // Minimum traction 
      if (!repo.updated_at) continue; 
 
      const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 
60 * 60 * 24); 
      if (daysSinceUpdate > 180) continue; // Skip abandoned repos (>6 months no activity) 
 
      // Deeper signal checks 
      const [hvFiles, commitSignals] = await Promise.all([ 
        checkHighValueFiles(repo.full_name), 
        getRecentCommitSignals(repo.full_name), 
      ]); 
 
      const signalScore = 
        (repo.stargazers_count > 500 ? 2 : 1) + 
        hvFiles.length * 2 + 
        commitSignals.length * 3 + 
        (daysSinceUpdate < 14 ? 3 : daysSinceUpdate < 30 ? 2 : 1); 
 
      if (signalScore < 3) continue; // Below threshold 
 
      candidates.push({ 
        full_name:       repo.full_name, 
        url:             repo.html_url, 
        description:     repo.description ?? '', 
        stars:           repo.stargazers_count, 
        updated_at:      repo.updated_at, 
        days_since_update: Math.round(daysSinceUpdate), 
        topic_found_in:  topic, 
        signal_score:    signalScore, 
        high_value_files: hvFiles, 
        commit_signals:   commitSignals, 
      }); 
    } 
 
    // Rate limit protection — 1 second between topic searches 
    await new Promise(r => setTimeout(r, 1000)); 
  } 
 
  // Sort by signal score, take top 5 for twin agent 
  const top = candidates.sort((a, b) => b.signal_score - a.signal_score).slice(0, 5); 
 
  const report = { 
    generated:   getTodayString(), 
    week:        getCurrentWeek(), 
    candidates_found: candidates.length, 
    top_candidates:   top, 
    all_candidates:   candidates.slice(0, 20), 
    summary: `Found ${candidates.length} candidates. Top ${top.length} sent to twin agent.`, 
  }; 
 
  writeJSON('intelligence/scout-report.json', report); 
  console.log(`[scout-agent] Done. ${candidates.length} candidates found. Top ${top.length} 
queued for twin agent.`); 
} 
 
main();