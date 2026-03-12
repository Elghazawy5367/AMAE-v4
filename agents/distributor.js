 
// === FILE: agents/distributor.js === 
// Job: Master distribution orchestrator — routes content to all platform distributors 
// Reads: campaigns/[WEEK]/text/, config/posting-schedule.json 
// Called by: .github/workflows/on-pr-merge-distribute.yml 
 
import { readJSON, readText, listFiles } from '../lib/file-utils.js'; 
import { getCurrentWeek } from '../lib/week-utils.js'; 
import { exec } from 'child_process'; 
import { promisify } from 'util'; 
 
const execAsync = promisify(exec); 
 
// Distribution routing table 
// Maps content filename → distributor agent 
const DISTRIBUTION_MAP = { 
  'linkedin-posts.md':           { agent: 'agents/dist-linkedin.js',    autoPost: true  }, 
  'twitter-x-threads.md':        { agent: 'agents/dist-twitter-x.js',   autoPost: true  }, 
  'instagram-reels-scripts.md':  { agent: 'agents/dist-instagram.js',   autoPost: true  }, 
  'instagram-stories.md':        { agent: 'agents/dist-instagram.js',   autoPost: true  }, 
  'facebook-post.md':            { agent: 'agents/dist-facebook.js',     autoPost: true  }, 
  'tiktok-scripts.md':           { agent: 'agents/dist-tiktok.js',       autoPost: false }, // Video upload 
needs review 
  'threads-posts.md':            { agent: 'agents/dist-threads.js',     autoPost: true  }, 
  'newsletter.md':               { agent: 'agents/dist-beehiiv.js',     autoPost: true, 
                                   note: 'Creates Beehiiv draft only — HUMAN SENDS' }, 
  'reddit-post.md':              { agent: 'agents/dist-reddit.js',      autoPost: false, 
                                   note: '🔴 HUMAN POSTS MANUALLY — never auto-post Reddit' }, 
  'quora-answers.md':            { agent: null,                          autoPost: false, 
                                   note: '🟡 HUMAN POSTS MANUALLY — never auto-post Quora' }, 
  'aeo-article-cluster.md':      { agent: 'agents/dist-github.js',      autoPost: true  }, 
}; 
 
async function runDistributor(agent, contentFile) { 
  try { 
    console.log(`[distributor.js] Running: ${agent} for ${contentFile}`); 
    const { stdout, stderr } = await execAsync(`node ${agent}`, { 
      env: { ...process.env, CONTENT_FILE: contentFile }, 
      timeout: 60000, 
    }); 
    if (stdout) console.log(`[${agent}]`, stdout.slice(0, 300)); 
    if (stderr) console.error(`[${agent}] stderr:`, stderr.slice(0, 200)); 
    return { success: true }; 
  } catch (err) { 
    console.error(`[distributor.js] Failed: ${agent}:`, err.message); 
    return { success: false, error: err.message }; 
  } 
} 
 
async function main() { 
  console.log('[distributor.js] Starting distribution...'); 
 
  const week     = getCurrentWeek(); 
  const schedule = readJSON('config/posting-schedule.json') ?? {}; 
  const results  = []; 
 
  for (const [contentFile, config] of Object.entries(DISTRIBUTION_MAP)) { 
    const fullPath = `campaigns/${week}/text/${contentFile}`; 
    const content  = readText(fullPath); 
 
    if (!content) { 
      console.log(`[distributor.js] Skipping ${contentFile} — file not found`); 
      continue; 
    } 
 
    if (!config.autoPost) { 
      console.log(`[distributor.js] MANUAL REQUIRED: ${contentFile} — ${config.note ?? 
'human review'}`); 
      results.push({ file: contentFile, status: 'manual_required', note: config.note }); 
      continue; 
    } 
 
    if (!config.agent) { 
      results.push({ file: contentFile, status: 'no_agent', note: config.note }); 
      continue; 
    } 
 
    const result = await runDistributor(config.agent, fullPath); 
    results.push({ file: contentFile, status: result.success ? 'posted' : 'failed', ...result }); 
 
    await new Promise(r => setTimeout(r, 2000)); // Throttle between platform posts 
  } 
 
  // Profile README update always runs 
  await runDistributor('agents/profile-readme-agent.js', `campaigns/${week}`); 
 
  const posted  = results.filter(r => r.status === 'posted').length; 
  const manual  = results.filter(r => r.status === 'manual_required').length; 
  const failed  = results.filter(r => r.status === 'failed').length; 
 
  console.log(`[distributor.js] Distribution complete.`); 
  console.log(`  Posted: ${posted} | Manual required: ${manual} | Failed: ${failed}`); 
  if (manual > 0) { 
    console.log('[distributor.js] MANUAL ACTIONS NEEDED:'); 
    results.filter(r => r.status === 'manual_required').forEach(r => 
      console.log(`  - ${r.file}: ${r.note}`) 
    ); 
  } 
} 
 
main();