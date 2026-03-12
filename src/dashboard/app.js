// AMAE Dashboard App — reads memory files and renders campaign status 
import { renderCampaignStatus }   from './components/CampaignStatus.js'; 
import { renderIntelligenceBrief } from './components/IntelligenceBrief.js'; 
import { renderResonanceTracker } from './components/ResonanceTracker.js'; 
import { renderFunnelMetrics }    from './components/FunnelMetrics.js'; 
 
async function load(path) { 
  try { const r = await fetch(path); return r.ok ? r.json() : null; } 
  catch { return null; } 
} 
 
async function main() { 
  const [perf, insights, funnel, hooks] = await Promise.all([ 
    load('../../memory/performance.json'), 
    load('../../memory/insights.json'), 
    load('../../memory/funnel-performance.json'), 
    load('../../memory/hook-performance.json'), 
  ]); 
 
  const app = document.getElementById('app'); 
  app.innerHTML = [ 
    renderCampaignStatus(perf, insights), 
    renderFunnelMetrics(funnel), 
    renderResonanceTracker(perf), 
    renderIntelligenceBrief(insights, hooks), 
  ].join(''); 
} 
 
main();