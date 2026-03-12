// === FILE: agents/memory-parser.js === 
// Job: Parse founder's manual resonance-log.md into memory/performance.json 
// This is the BRIDGE between human observation and system memory. 
// Without this, memory-agent.js reads stale data and AMAE never learns. 
// 
// Reads:  analytics/resonance-log.md  (founder manually updates this) 
// Writes: memory/performance.json     (memory-agent.js reads this) 
//         memory/hook-performance.json 
// Called by: .github/workflows/weekly-campaign.yml (runs BEFORE memory-agent.js) 
//            monthly-growth.yml 
 
import { readText, readJSON, writeJSON } from '../lib/file-utils.js'; 
import { getCurrentWeek, getTodayString } from '../lib/week-utils.js'; 
 
// Resonance log format that founder uses: 
// ## Week: 2026-W12 
// **Platform:** linkedin 
// **Signal:** Comment: "this is exactly my situation" 
// **Type:** comment_resonance | dm_inquiry | unprompted_share | reply_frustration | 
engaged_follow 
// **Hook Used:** (optional — paste the hook that triggered this) 
// --- 
 
function parseResonanceLog(logContent) { 
  const signals   = []; 
  const weeks     = logContent.split(/^## Week:/m).slice(1); 
 
  for (const weekBlock of weeks) { 
    const weekMatch    = weekBlock.match(/^(20\d{2}-W\d{2})/); 
    const week         = weekMatch ? weekMatch[1] : 'unknown'; 
    const entries      = weekBlock.split(/^---$/m); 
 
    for (const entry of entries) { 
      if (!entry.trim()) continue; 
 
      const platform = (entry.match(/\*\*Platform:\*\*\s*(\S+)/i) || [])[1]?.toLowerCase() ?? null; 
      const signal   = (entry.match(/\*\*Signal:\*\*\s*(.+)/i) || [])[1]?.trim() ?? null; 
      const type     = (entry.match(/\*\*Type:\*\*\s*(\S+)/i) || [])[1]?.toLowerCase() ?? null; 
      const hook     = (entry.match(/\*\*Hook Used:\*\*\s*(.+)/i) || [])[1]?.trim() ?? null; 
 
      // Only count real resonance signal types — not vanity metrics 
      const VALID_TYPES = [ 
        'comment_resonance', 'dm_inquiry', 'unprompted_share', 
        'reply_frustration', 'engaged_follow', 
      ]; 
 
      if (signal && platform && VALID_TYPES.includes(type)) { 
        signals.push({ week, platform, signal, type, hook }); 
      } 
    } 
  } 
 
  return signals; 
} 
 
function buildPerformanceJSON(signals, existing) { 
  const perf = existing ?? { 
    _description:               'Weekly performance metrics. Auto-populated by memory-parser.js 
from resonance-log.md.', 
    weeks_running:              0, 
    weeks_without_resonance:    0, 
    total_resonance_signals:    0, 
    last_signal_week:           null, 
    best_platform:              null, 
    by_platform:                {}, 
    by_week:                    {}, 
  }; 
 
  // Group signals by week and platform 
  for (const s of signals) { 
    // Week entry 
    if (!perf.by_week[s.week]) { 
      perf.by_week[s.week] = { resonance_signals: 0, platforms: {} }; 
    } 
    perf.by_week[s.week].resonance_signals++; 
 
    // Platform entry 
    if (!perf.by_platform[s.platform]) { 
      perf.by_platform[s.platform] = { resonance_signals: 0, signal_types: {} }; 
    } 
    perf.by_platform[s.platform].resonance_signals++; 
 
    const t = s.type; 
    perf.by_platform[s.platform].signal_types[t] = (perf.by_platform[s.platform].signal_types[t] 
?? 0) + 1; 
  } 
 
  // Compute top-level stats 
  perf.total_resonance_signals = signals.length; 
  perf.last_signal_week        = signals.length ? signals[signals.length - 1].week : null; 
 
  // Best platform 
  perf.best_platform = Object.entries(perf.by_platform) 
    .sort((a, b) => b[1].resonance_signals - a[1].resonance_signals)[0]?.[0] ?? null; 
 
  // Weeks running (count distinct weeks in by_week) 
  const allWeeks = Object.keys(perf.by_week).sort(); 
  perf.weeks_running = allWeeks.length; 
 
  // Weeks without resonance (consecutive weeks from most recent with 0 signals) 
  const currentWeek = getCurrentWeek(); 
  let noSignalStreak = 0; 
  const sortedWeeks  = allWeeks.reverse(); // most recent first 
  for (const w of [currentWeek, ...sortedWeeks]) { 
    if ((perf.by_week[w]?.resonance_signals ?? 0) === 0) { 
      noSignalStreak++; 
    } else { 
      break; 
    } 
  } 
  perf.weeks_without_resonance = noSignalStreak; 
 
  perf.last_parsed = getTodayString(); 
  return perf; 
} 
 
function buildHookPerformanceJSON(signals, existing) { 
  const hp = existing ?? { 
    _description: 'Which hooks generated resonance signals. Auto-populated by 
memory-parser.js.', 
    best_performing: [], 
    by_platform:     {}, 
  }; 
 
  const hookMap = {}; 
 
  for (const s of signals) { 
    if (!s.hook) continue; 
 
    const key = `${s.platform}::${s.hook}`; 
    if (!hookMap[key]) { 
      hookMap[key] = { hook: s.hook, platform: s.platform, signal_count: 0, weeks_triggered: [] 
}; 
    } 
    hookMap[key].signal_count++; 
    if (!hookMap[key].weeks_triggered.includes(s.week)) { 
      hookMap[key].weeks_triggered.push(s.week); 
    } 
  } 
 
  hp.best_performing = Object.values(hookMap) 
    .sort((a, b) => b.signal_count - a.signal_count) 
    .slice(0, 10); 
 
  hp.last_updated = getTodayString(); 
  return hp; 
} 
 
async function main() { 
  console.log('[memory-parser.js] Parsing resonance log...'); 
 
  const logPath  = 'analytics/resonance-log.md'; 
  const logContent = readText(logPath); 
 
  if (!logContent || logContent.trim() === '' || logContent.includes('No signals logged yet')) { 
    console.log('[memory-parser.js] No resonance data yet. Initialising empty 
performance.json.'); 
    const empty = { 
      _description:            'Weekly performance metrics. Updated by memory-parser.js.', 
      weeks_running:           0, 
      weeks_without_resonance: 0, 
      total_resonance_signals: 0, 
      last_signal_week:        null, 
      best_platform:           null, 
      by_platform:             {}, 
      by_week:                 {}, 
      last_parsed:             getTodayString(), 
    }; 
    writeJSON('memory/performance.json', empty); 
    console.log('[memory-parser.js] Wrote empty performance.json. Log resonance signals to 
analytics/resonance-log.md to activate learning.'); 
    return; 
  } 
 
  const signals    = parseResonanceLog(logContent); 
  console.log(`[memory-parser.js] Parsed ${signals.length} resonance signals.`); 
 
  const existingPerf  = readJSON('memory/performance.json'); 
  const existingHooks = readJSON('memory/hook-performance.json'); 
 
  const performance   = buildPerformanceJSON(signals, existingPerf); 
  const hookPerf      = buildHookPerformanceJSON(signals, existingHooks); 
 
  writeJSON('memory/performance.json',      performance); 
  writeJSON('memory/hook-performance.json', hookPerf); 
 
  console.log(`[memory-parser.js] Done.`); 
  console.log(`  Total signals: ${performance.total_resonance_signals}`); 
  console.log(`  Weeks running: ${performance.weeks_running}`); 
  console.log(`  Weeks without signal: ${performance.weeks_without_resonance}`); 
  console.log(`  Best platform: ${performance.best_platform ?? 'none yet'}`); 
 
  if (performance.weeks_without_resonance >= 6) { 
    console.log('[memory-parser.js] WARNING: 6+ weeks without resonance. Run the Desire 
Discovery Protocol. product-dna.json the_desire section needs revision.'); 
  } 
} 
 
main().catch(err => { console.error('[memory-parser.js] FAILED:', err.message); 
process.exit(1); });