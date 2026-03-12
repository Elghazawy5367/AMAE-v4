export function renderIntelligenceBrief(insights, hooks) { 
  const hookItems = hooks?.best_performing?.length 
    ? hooks.best_performing.slice(0, 5).map(h => 
        `<div class="item">"${h.hook || 'No text'}" <span class="tag">${h.platform || 
''}</span></div>` 
      ).join('') 
    : '<p style="color:#6b7280;font-size:0.875rem">No hook performance data yet. Log 
resonance signals to build this.</p>'; 
 
  return ` 
<h2>Intelligence Brief</h2> 
<div class="card"> 
  <div 
style="font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margi
n-bottom:0.75rem">Best Performing Hooks</div> 
  ${hookItems} 
</div>`; 
}