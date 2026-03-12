// Campaigns feature — reads campaign files and builds campaign list 
 
import { getCurrentWeek } from '../../lib/week-utils.js'; 
 
export async function loadCurrentCampaign() { 
  const week = getCurrentWeek(); 
  const paths = { 
    strategyBrief: `../../campaigns/${week}/strategy-brief.md`, 
    funnelMap:     `../../campaigns/${week}/funnel-map.json`, 
    guardLog:      `../../campaigns/${week}/content-mirror-log.md`, 
  }; 
 
  const results = {}; 
  for (const [key, path] of Object.entries(paths)) { 
    try { 
      const r = await fetch(path); 
      if (r.ok) { 
        results[key] = path.endsWith('.json') ? await r.json() : await r.text(); 
      } 
    } catch { 
      results[key] = null; 
    } 
  } 
 
  return { week, ...results }; 
} 
 
export function parseContentFiles(funnelMap) { 
  if (!funnelMap?.classified_pieces) return []; 
  return funnelMap.classified_pieces.map(piece => ({ 
    platform: piece.platform, 
    file:     piece.file, 
    stage:    piece.stage, 
    score:    null, 
  })); 
} 
``` 
 
--- 
 
# AMAE COMPLETE REPOSITORY — FINAL MANIFEST 
 
## Combine all parts