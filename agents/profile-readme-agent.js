// === FILE: agents/profile-readme-agent.js === 
// Job: Update GitHub profile README with live AMAE dashboard stats 
// Reads: memory/performance.json, memory/insights.json, analytics/ 
// Writes: README.md (root — this is the GitHub profile README) 
// Called by: .github/workflows/update-profile-readme.yml + distributor.js on merge 
 
import { readJSON, writeFile }   from '../lib/file-utils.js'; 
import { callModel, MODELS }     from '../lib/openrouter.js'; 
import { getCurrentWeek, getTodayString } from '../lib/week-utils.js'; 
 
function buildDashboard(product, performance, insights, week) { 
  const topPlatform = performance?.by_platform 
    ? Object.entries(performance.by_platform).sort((a, b) => (b[1].resonance_signals ?? 0) - 
(a[1].resonance_signals ?? 0))[0]?.[0] 
    : 'TBD'; 
 
  const weeksRunning = performance?.weeks_running ?? 0; 
  const totalSignals = performance?.total_resonance_signals ?? 0; 
 
  return `<!-- AMAE-DASHBOARD-START --> 
## 📊 AMAE Live Dashboard 
*Auto-updated by AMAE every week · ${getTodayString()}* 
 
| Metric | Value | 
|--------|-------| 
| 🗓️ Current Campaign | ${week} | 
| 📡 Best Platform | ${topPlatform} | 
| ✅ Resonance Signals | ${totalSignals} total | 
| 🔁 Weeks Running | ${weeksRunning} | 
 
${insights?.recommendation ? `> **This week's focus:** ${insights.recommendation}` : ''} 
${insights?.alert ? `> ⚠️ **Alert:** ${insights.alert}` : ''} 
<!-- AMAE-DASHBOARD-END -->`; 
} 
 
async function main() { 
  console.log('[profile-readme-agent.js] Updating profile README dashboard...'); 
 
  const dna         = readJSON('config/product-dna.json'); 
  const product     = dna?.products?.[dna?.active_product]; 
  const performance = readJSON('memory/performance.json') ?? {}; 
  const insights    = readJSON('memory/insights.json')    ?? {}; 
  const week        = getCurrentWeek(); 
 
  const readmePath  = 'README.md'; 
  const { readText } = await import('../lib/file-utils.js'); 
  let readme        = readText(readmePath) ?? ''; 
 
  const dashboard   = buildDashboard(product, performance, insights, week); 
 
  // Replace existing dashboard block or append 
  if (readme.includes('<!-- AMAE-DASHBOARD-START -->')) { 
    readme = readme.replace( 
      /<!-- AMAE-DASHBOARD-START -->[\s\S]*?<!-- AMAE-DASHBOARD-END -->/, 
      dashboard 
    ); 
  } else { 
    readme = readme + '\n\n' + dashboard; 
  } 
 
  writeFile(readmePath, readme); 
  console.log('[profile-readme-agent.js] Profile README dashboard updated.'); 
} 
 
main();