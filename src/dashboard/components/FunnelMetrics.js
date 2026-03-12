export function renderFunnelMetrics(funnel) { 
  const stages = funnel?.by_stage ?? {}; 
  const tofu   = stages.TOFU?.resonance_signals ?? 0; 
  const mofu   = stages.MOFU?.resonance_signals ?? 0; 
  const bofu   = stages.BOFU?.resonance_signals ?? 0; 
  const bottleneck = funnel?.current_bottleneck ?? 'awareness'; 
 
  const bottleneckMap = { 
    awareness:     { label: 'Awareness', tip: 'Focus 60%+ on TOFU content this week' }, 
    consideration: { label: 'Consideration', tip: 'Add more how-to and proof content (MOFU)' }, 
    conversion:    { label: 'Conversion', tip: 'Add objection-handling and comparison content 
(BOFU)' }, 
    retention:     { label: 'Retention', tip: 'Email sequences and community seeding priority' }, 
  }; 
 
  const b = bottleneckMap[bottleneck] ?? bottleneckMap.awareness; 
 
  return ` 
<h2>Funnel Metrics</h2> 
<div class="grid"> 
  <div class="card"> 
    <div class="big-num">${tofu}</div> 
    <div class="label">TOFU Signals (Awareness)</div> 
  </div> 
  <div class="card"> 
    <div class="big-num">${mofu}</div> 
    <div class="label">MOFU Signals (Consideration)</div> 
  </div> 
  <div class="card"> 
    <div class="big-num">${bofu}</div> 
    <div class="label">BOFU Signals (Conversion)</div> 
  </div> 
</div> 
<div class="card" style="margin-top:0"> 
  <strong>Current bottleneck:</strong> ${b.label} 
  <div style="color:#6b7280;font-size:0.875rem;margin-top:4px">💡 ${b.tip}</div> 
</div>`; 
}