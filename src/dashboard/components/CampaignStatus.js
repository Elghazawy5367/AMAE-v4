export function renderCampaignStatus(perf, insights) { 
  const weeks   = perf?.weeks_running         ?? 0; 
  const signals = perf?.total_resonance_signals ?? 0; 
  const noSignal = perf?.weeks_without_resonance ?? 0; 
 
  const statusBadge = noSignal >= 6 
    ? `<span style="background:#fee2e2;color:#dc2626;padding:3px 
10px;border-radius:99px;font-size:0.75rem">⚠️ Review desire section</span>` 
    : noSignal >= 3 
    ? `<span style="background:#fef3c7;color:#d97706;padding:3px 
10px;border-radius:99px;font-size:0.75rem">👀 Watch closely</span>` 
    : `<span style="background:#dcfce7;color:#16a34a;padding:3px 
10px;border-radius:99px;font-size:0.75rem">✅ On track</span>`; 
 
  const alert = insights?.alert 
    ? `<div style="background:#fef3c7;border:1px solid 
#fde68a;padding:0.75rem;border-radius:6px;margin-bottom:1rem;font-size:0.875rem">⚠️ 
${insights.alert}</div>` 
    : ''; 
 
  return ` 
${alert} 
<h2>Campaign Status</h2> 
<div class="grid"> 
  <div class="card"> 
    <div class="big-num">${signals}</div> 
    <div class="label">Resonance Signals Total</div> 
  </div> 
  <div class="card"> 
    <div class="big-num">${weeks}</div> 
    <div class="label">Weeks Running</div> 
  </div> 
  <div class="card"> 
    <div class="big-num">${noSignal}</div> 
    <div class="label">Weeks Without Signal</div> 
    <div style="margin-top:8px">${statusBadge}</div> 
  </div> 
</div> 
${insights?.recommendation ? `<div class="card" style="margin-top:1rem"><strong>This 
week:</strong> ${insights.recommendation}</div>` : ''}`; 
}