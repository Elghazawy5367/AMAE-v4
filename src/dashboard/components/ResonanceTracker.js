export function renderResonanceTracker(perf) { 
  const signals = perf?.resonance_log?.slice(-5) ?? []; 
 
  const items = signals.length 
    ? signals.map(s => `<div class="item">${s.platform ? `<span 
class="tag">${s.platform}</span> ` : ''}${s.signal}</div>`).join('') 
    : '<p style="color:#6b7280;font-size:0.875rem">No resonance signals logged yet.<br>Log 
them in <code>analytics/resonance-log.md</code> after each campaign.</p>'; 
 
  return ` 
<h2>Recent Resonance Signals</h2> 
<div class="card">${items}</div> 
<div style="font-size:0.8rem;color:#6b7280;margin-top:0.5rem"> 
  ✅ Signals that matter: "this is exactly my situation", DMs asking for access, unprompted 
shares<br> 
  ❌ Signals that don't: likes, impressions, generic "great post!" comments 
</div>`; 
}