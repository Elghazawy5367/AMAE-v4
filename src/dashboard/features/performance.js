// Performance feature — reads and aggregates performance data 
 
export async function loadPerformanceData() { 
  const files = [ 
    '../../memory/performance.json', 
    '../../memory/insights.json', 
    '../../memory/funnel-performance.json', 
    '../../memory/hook-performance.json', 
    '../../analytics/funnel-metrics.json', 
  ]; 
 
  const results = await Promise.allSettled( 
    files.map(f => fetch(f).then(r => r.ok ? r.json() : null).catch(() => null)) 
  ); 
 
  return { 
    performance:  results[0].value, 
    insights:     results[1].value, 
    funnel:       results[2].value, 
    hooks:        results[3].value, 
    funnelMetrics: results[4].value, 
  }; 
} 
 
export function calculateWeeklyTrend(performanceHistory) { 
  if (!performanceHistory?.length || performanceHistory.length < 2) return 'insufficient_data'; 
 
  const recent = performanceHistory.slice(-4); 
  const avgRecent  = recent.reduce((s, w) => s + (w.resonance_signals ?? 0), 0) / 
recent.length; 
  const prior      = performanceHistory.slice(-8, -4); 
  const avgPrior   = prior.length 
    ? prior.reduce((s, w) => s + (w.resonance_signals ?? 0), 0) / prior.length 
    : avgRecent; 
 
  if (avgRecent > avgPrior * 1.2) return 'improving'; 
  if (avgRecent < avgPrior * 0.8) return 'declining'; 
  return 'stable'; 
}