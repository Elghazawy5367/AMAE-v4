// AMAE Dashboard — reads from memory/ and analytics/ JSON files 
// This is a local dashboard — no server needed, reads files directly in dev 
 
const MEMORY_FILES = { 
  performance: '/memory/performance.json', 
  insights:    '/memory/insights.json', 
  hooks:       '/memory/hook-performance.json', 
  citations:   '/memory/citations.json', 
  funnel:      '/memory/funnel-performance.json', 
}; 
 
async function loadJSON(path) { 
  try { 
    const r = await fetch(path); 
    if (!r.ok) return null; 
    return r.json(); 
  } catch { 
    return null; 
  } 
} 
 
async function renderDashboard() { 
  const [performance, insights, hooks, funnel] = await Promise.all([ 
    loadJSON(MEMORY_FILES.performance), 
    loadJSON(MEMORY_FILES.insights), 
    loadJSON(MEMORY_FILES.hooks), 
    loadJSON(MEMORY_FILES.funnel), 
  ]); 
 
  const main = document.getElementById('main-content'); 
 
  // Alert section 
  const alerts = []; 
  if (insights?.alert) alerts.push(`<div class="alert alert-warning">⚠️ ${insights.alert}</div>`); 
 
  // Stats overview 
  const stats = ` 
    <div class="stat-grid"> 
      <div class="card"> 
        <div class="stat-value">${performance?.total_resonance_signals ?? 0}</div> 
        <div class="stat-label">Total Resonance Signals</div> 
      </div> 
      <div class="card"> 
        <div class="stat-value">${performance?.weeks_running ?? 0}</div> 
        <div class="stat-label">Weeks Running</div> 
      </div> 
      <div class="card"> 
        <div class="stat-value">${performance?.weeks_without_resonance ?? 0}</div> 
        <div class="stat-label">Weeks Without Signal</div> 
        ${(performance?.weeks_without_resonance ?? 0) >= 3 
          ? '<div class="badge badge-red">Review desire section</div>' 
          : '<div class="badge badge-green">On track</div>'} 
      </div> 
      <div class="card"> 
        <div class="stat-value">${funnel?.current_bottleneck ?? 'N/A'}</div> 
        <div class="stat-label">Funnel Bottleneck</div> 
      </div> 
    </div>`; 
 
  // Insights section 
  const insightsSection = insights ? ` 
    <div class="card"> 
      <div class="card-title">This Week's Recommendation</div> 
      <p>${insights.recommendation ?? 'No recommendation yet — run a campaign first.'}</p> 
    </div>` : ''; 
 
  // Resonance log summary 
  const resonanceSection = ` 
    <div class="card"> 
      <div class="card-title">Recent Resonance Signals</div> 
      <p class="loading" style="font-size:0.875rem; padding:0.5rem 0; text-align:left;"> 
        Log signals in <code>analytics/resonance-log.md</code> after each campaign. 
      </p> 
    </div>`; 
 
  // Best hooks 
  const hooksSection = hooks?.best_performing?.length ? ` 
    <div class="card"> 
      <div class="card-title">Best Performing Hooks</div> 
      ${hooks.best_performing.map(h => 
        `<div class="resonance-item">"${h.hook}" <span class="badge 
badge-blue">${h.platform}</span></div>` 
      ).join('')} 
    </div>` : ''; 
 
  main.innerHTML = alerts.join('') + stats + insightsSection + resonanceSection + 
hooksSection; 
} 
 
renderDashboard();